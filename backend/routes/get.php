<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

include './db.php';

function base64UrlDecode($data) {
    return base64_decode(strtr($data, '-_', '+/'));
}

function verifyJWT($jwt, $secretKey) {
    $parts = explode('.', $jwt);
    if (count($parts) !== 3) {
        return null;
    }

    list($encodedHeader, $encodedPayload, $encodedSignature) = $parts;
    $payload = json_decode(base64UrlDecode($encodedPayload), true);
    
    $expectedSignature = hash_hmac('sha256', "$encodedHeader.$encodedPayload", $secretKey, true);
    $expectedSignatureEncoded = rtrim(strtr(base64_encode($expectedSignature), '+/', '-_'), '=');

    return hash_equals($expectedSignatureEncoded, $encodedSignature) ? $payload : null;
}

function getUserData() {
    global $conn;

    // Get the Authorization header from the request
    $headers = getallheaders();
    if (!isset($headers['Authorization'])) {
        echo json_encode(["error" => "Missing token"]);
        exit;
    }

    // Extract token from "Bearer <token>"
    $token = str_replace("Bearer ", "", $headers['Authorization']);
    $secretKey = 'your-secret-key'; // Ensure this is the same key used for JWT generation

    // Verify the token
    $decodedPayload = verifyJWT($token, $secretKey);

    if (!$decodedPayload || !isset($decodedPayload['uid'])) {
        echo json_encode(["error" => "Invalid or expired token"]);
        exit;
    }

    // Get the user ID from the decoded JWT payload
    $userid = intval($decodedPayload['uid']);

    // Prepare and execute the query to fetch user data including profile picture
    $stmt = $conn->prepare("SELECT userid, first_name, last_name, username, email, contact_number, role, location, profilepic FROM users WHERE userid = ?");
    $stmt->bind_param("i", $userid);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $user = $result->fetch_assoc();

        // Append full path to profile picture
        $user['profilepic'] = $user['profilepic'] 
            ? "http://localhost/CAPSTONE/backend/uploads/" . $user['profilepic']
            : "http://localhost/CAPSTONE/backend/uploads/default_profile.png";

        echo json_encode($user);
    } else {
        echo json_encode(["error" => "User not found"]);
    }

    $stmt->close();
}

// Call the function to fetch and return user data
function getAllUsers() {
    global $conn;

    // Get the Authorization header from the request
    $headers = getallheaders();
    if (!isset($headers['Authorization'])) {
        echo json_encode(["error" => "Missing token"]);
        exit;
    }

    // Extract token from "Bearer <token>"
    $token = str_replace("Bearer ", "", $headers['Authorization']);
    $secretKey = 'your-secret-key'; // Ensure this is the same key used for JWT generation

    // Verify the token
    $decodedPayload = verifyJWT($token, $secretKey);

    if (!$decodedPayload || !isset($decodedPayload['uid'])) {
        echo json_encode(["error" => "Invalid or expired token"]);
        exit;
    }

    // Check if the user is an admin
    $userid = intval($decodedPayload['uid']);
    $stmt = $conn->prepare("SELECT role FROM users WHERE userid = ?");
    $stmt->bind_param("i", $userid);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        echo json_encode(["error" => "User not found"]);
        exit;
    }

    $user = $result->fetch_assoc();
    if ($user['role'] !== 'admin') {
        echo json_encode(["error" => "Unauthorized"]);
        exit;
    }

    // Fetch all users
    $stmt = $conn->prepare("SELECT userid, first_name, last_name, username, email, contact_number, role, location, profilepic FROM users");
    $stmt->execute();
    $result = $stmt->get_result();

    $users = [];
    while ($row = $result->fetch_assoc()) {
        // Append full path to profile picture
        $row['profilepic'] = $row['profilepic'] 
            ? "http://localhost/CAPSTONE/backend/uploads/" . $row['profilepic']
            : "http://localhost/CAPSTONE/backend/uploads/default_profile.png";

        $users[] = $row;
    }

    echo json_encode($users);

    $stmt->close();
}


function getRunnerApplications() {
    global $conn;

    // Get the Authorization header
    $headers = getallheaders();
    if (!isset($headers['Authorization'])) {
        echo json_encode(["error" => "Missing token"]);
        exit;
    }

    // Verify the token
    $token = str_replace("Bearer ", "", $headers['Authorization']);
    $secretKey = 'your-secret-key';
    $decodedPayload = verifyJWT($token, $secretKey);

    if (!$decodedPayload || !isset($decodedPayload['uid'])) {
        echo json_encode(["error" => "Invalid or expired token"]);
        exit;
    }

    // Check if the user is an admin
    $userid = intval($decodedPayload['uid']);
    $stmt = $conn->prepare("SELECT role FROM users WHERE userid = ?");
    $stmt->bind_param("i", $userid);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0 || $result->fetch_assoc()['role'] !== 'admin') {
        echo json_encode(["error" => "Unauthorized"]);
        exit;
    }

    // Fetch all runner applications
    $stmt = $conn->prepare("SELECT application_id, userid, mode_of_transport, emergency_contact_person, emergency_contact_number, status, 
        CONCAT('http://localhost/capstone/backend/uploads/Documents/', valid_id_1) AS valid_id_1_url,
        CONCAT('http://localhost/capstone/backend/uploads/Documents/', valid_id_2) AS valid_id_2_url,
        CONCAT('http://localhost/capstone/backend/uploads/Documents/', police_clearance) AS police_clearance_url,
        CONCAT('http://localhost/capstone/backend/uploads/Documents/', barangay_clearance) AS barangay_clearance_url
        FROM runner_applications");
    $stmt->execute();
    $result = $stmt->get_result();

    $applications = [];
    while ($row = $result->fetch_assoc()) {
        $applications[] = $row;
    }

    echo json_encode($applications);

    $stmt->close();
}









?>
