<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

include './db.php'; // Ensure this connects to the "ada" database



require 'PHPMailer-master/src/PHPMailer.php';
require 'PHPMailer-master/src/SMTP.php';
require 'PHPMailer-master/src/Exception.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;










function base64UrlEncode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function generateJWT($payload, $secretKey) {
    $header = json_encode(['alg' => 'HS256', 'typ' => 'JWT']);
    $encodedHeader = base64UrlEncode($header);
    $encodedPayload = base64UrlEncode(json_encode($payload));
    $signature = hash_hmac('sha256', "$encodedHeader.$encodedPayload", $secretKey, true);
    $encodedSignature = base64UrlEncode($signature);
    return "$encodedHeader.$encodedPayload.$encodedSignature";
}

function sendVerificationEmail($email, $code) {
    $mail = new PHPMailer(true);

    try {
        // Enable debugging
        $mail->SMTPDebug = 2;  // Set to 2 for detailed debugging (set to 0 when done testing)
        $mail->Debugoutput = 'error_log'; // Logs errors to PHP error log

        // SMTP Configuration
        $mail->isSMTP();
        $mail->Host = 'smtp.gmail.com'; // Change if using a different provider
        $mail->SMTPAuth = true;
        $mail->Username = '201811522@gordoncollege.edu.ph'; // Your email
        $mail->Password = 'gogp tazd tdlf ymha'; // Use an App Password, not your email password
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = 587;

        // Sender & Recipient
        $mail->setFrom('your-email@gmail.com', 'SIBAT'); // Update sender details
        $mail->addAddress($email);

        // Email Content
        $mail->isHTML(true);
        $mail->Subject = "Verify Your Email";
        $mail->Body = "<p>Your verification code is: <b>$code</b></p>";

        $mail->send();
        error_log("Email sent successfully to: $email");
        return true;
    } catch (Exception $e) {
        error_log("Email sending failed: " . $mail->ErrorInfo);
        return false;
    }
}



function handleLogin() {
    global $conn;
    $data = json_decode(file_get_contents("php://input"), true);

    if (!isset($data['username'], $data['password'])) {
        echo json_encode(["error" => "Username and password are required"]);
        exit;
    }

    $username = htmlspecialchars(strip_tags($data['username']));
    $password = $data['password'];

    $stmt = $conn->prepare("SELECT userid, username, password, role, is_verified FROM users WHERE username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $stmt->store_result();

    if ($stmt->num_rows === 0) {
        echo json_encode(["error" => "Invalid credentials"]);
        exit;
    }

    $stmt->bind_result($userId, $dbUsername, $dbPassword, $role, $is_verified);
    $stmt->fetch();

    if (!password_verify($password, $dbPassword)) {
        echo json_encode(["error" => "Invalid credentials"]);
        exit;
    }

    if ($is_verified == 0) {
        echo json_encode(["error" => "Please verify your email before logging in."]);
        exit;
    }

    $payload = [
        'uid' => $userId,
        'username' => $dbUsername,
        'role' => $role,
        'exp' => time() + 3600
    ];

    $secretKey = 'your-secret-key';
    $jwt = generateJWT($payload, $secretKey);

    echo json_encode([
        "message" => "Login successful",
        "token" => $jwt,
        "role" => $role
    ]);

    $stmt->close();
}

function handleRegister() {
    global $conn;
    $data = json_decode(file_get_contents("php://input"), true);

    if (!isset($data['first_name'], $data['last_name'], $data['username'], $data['email'], $data['contact_number'], $data['password'])) {
        echo json_encode(["error" => "Missing required fields"]);
        exit;
    }

    $first_name = htmlspecialchars(strip_tags($data['first_name']));
    $last_name = htmlspecialchars(strip_tags($data['last_name']));
    $username = htmlspecialchars(strip_tags($data['username']));
    $email = filter_var($data['email'], FILTER_SANITIZE_EMAIL);
    $contact_number = htmlspecialchars(strip_tags($data['contact_number']));
    $password = password_hash($data['password'], PASSWORD_BCRYPT);
    $role = isset($data['role']) && in_array($data['role'], ['admin', 'user', 'seller']) ? $data['role'] : 'user';

    $checkStmt = $conn->prepare("SELECT userid FROM users WHERE email = ? OR username = ?");
    $checkStmt->bind_param("ss", $email, $username);
    $checkStmt->execute();
    $checkStmt->store_result();

    if ($checkStmt->num_rows > 0) {
        echo json_encode(["error" => "Username or email already exists"]);
        exit;
    }
    $checkStmt->close();

    // Generate verification code
    $verification_code = rand(100000, 999999);

    $stmt = $conn->prepare("INSERT INTO users (first_name, last_name, username, email, contact_number, password, role, verification_code, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)");
    $stmt->bind_param("ssssssss", $first_name, $last_name, $username, $email, $contact_number, $password, $role, $verification_code);

    if ($stmt->execute()) {
        sendVerificationEmail($email, $verification_code);
        echo json_encode(["message" => "User registered successfully. A verification code has been sent to your email."]);
    } else {
        echo json_encode(["error" => "Registration failed"]);
    }

    $stmt->close();
}

function handleVerifyCode() {
    global $conn;
    $data = json_decode(file_get_contents("php://input"), true);

    if (!isset($data['email'], $data['verification_code'])) {
        echo json_encode(["success" => false, "error" => "Email and verification code are required"]);
        exit;
    }

    $email = filter_var($data['email'], FILTER_SANITIZE_EMAIL);
    $verification_code = htmlspecialchars(strip_tags($data['verification_code']));

    // Ensure the verification code is exactly 6 digits
    if (!preg_match('/^\d{6}$/', $verification_code)) {
        echo json_encode(["success" => false, "error" => "Invalid verification code format"]);
        exit;
    }

    $stmt = $conn->prepare("SELECT userid FROM users WHERE email = ? AND verification_code = ?");
    $stmt->bind_param("ss", $email, $verification_code);
    $stmt->execute();
    $stmt->store_result();

    if ($stmt->num_rows === 0) {
        $stmt->close();
        echo json_encode(["success" => false, "error" => "Invalid verification code"]);
        exit;
    }

    // Update user as verified
    $updateStmt = $conn->prepare("UPDATE users SET is_verified = 1, verification_code = NULL WHERE email = ?");
    $updateStmt->bind_param("s", $email);
    $updateStmt->execute();
    $updateStmt->close();

    echo json_encode(["success" => true, "message" => "Email verified successfully. You can now log in."]);

    $stmt->close();
}



?>
