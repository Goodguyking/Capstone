<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
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

    if (hash_equals($expectedSignatureEncoded, $encodedSignature)) {
        return $payload; // Return decoded user data
    } else {
        return null;
    }
}
function uploadProfilePic() { 
    global $conn;

    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        echo json_encode(["error" => "Invalid request"]);
        exit;
    }

    $headers = getallheaders();
    if (!isset($headers['Authorization'])) {
        echo json_encode(["error" => "Missing token"]);
        exit;
    }

    $token = str_replace("Bearer ", "", $headers['Authorization']);
    $secretKey = 'your-secret-key';
    $decodedPayload = verifyJWT($token, $secretKey);

    if (!$decodedPayload || !isset($decodedPayload['uid'])) {
        echo json_encode(["error" => "Invalid or expired token"]);
        exit;
    }

    $userid = intval($decodedPayload['uid']);

    if (!isset($_FILES["profilepic"])) {
        echo json_encode(["error" => "No file uploaded"]);
        exit;
    }

    $targetDir = "uploads/";
    $fileName = basename($_FILES["profilepic"]["name"]);
    $targetFilePath = $targetDir . $fileName;
    $fileType = strtolower(pathinfo($targetFilePath, PATHINFO_EXTENSION));

    // Allowed file types
    $allowedTypes = ["jpg", "jpeg", "png"];
    if (!in_array($fileType, $allowedTypes)) {
        echo json_encode(["error" => "Invalid file type"]);
        exit;
    }

    if (move_uploaded_file($_FILES["profilepic"]["tmp_name"], $targetFilePath)) {
        // Update profile picture in DB
        $stmt = $conn->prepare("UPDATE users SET profilepic = ? WHERE userid = ?");
        $stmt->bind_param("si", $fileName, $userid);
        $stmt->execute();

        echo json_encode(["profilepic" => "http://localhost/CAPSTONE/backend/uploads/" . $fileName]); 
    } else {
        echo json_encode(["error" => "Failed to upload"]);
    }
}

function updateUserProfile() {
    global $conn;

    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        echo json_encode(["error" => "Invalid request"]);
        exit;
    }

    $headers = getallheaders();
    if (!isset($headers['Authorization'])) {
        echo json_encode(["error" => "Missing token"]);
        exit;
    }

    $token = str_replace("Bearer ", "", $headers['Authorization']);
    $secretKey = 'your-secret-key';
    $decodedPayload = verifyJWT($token, $secretKey);

    if (!$decodedPayload || !isset($decodedPayload['uid'])) {
        echo json_encode(["error" => "Invalid or expired token"]);
        exit;
    }

    $userid = intval($decodedPayload['uid']);

    // Get JSON payload
    $data = json_decode(file_get_contents("php://input"), true);

    if (!$data) {
        echo json_encode(["error" => "Invalid input data"]);
        exit;
    }

    $firstName = $data['first_name'] ?? "";
    $lastName = $data['last_name'] ?? "";
    $email = $data['email'] ?? "";
    $location = $data['location'] ?? "";

    $stmt = $conn->prepare("UPDATE users SET first_name = ?, last_name = ?, email = ?, location = ? WHERE userid = ?");
    $stmt->bind_param("ssssi", $firstName, $lastName, $email, $location, $userid);

    if ($stmt->execute()) {
        echo json_encode(["message" => "Profile updated successfully"]);
    } else {
        echo json_encode(["error" => "Failed to update profile"]);
    }

    $stmt->close();
}




function applyAsRunner() {
    global $conn;

    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        echo json_encode(["error" => "Invalid request"]);
        exit;
    }

    // Verify Token
    $headers = getallheaders();
    if (!isset($headers['Authorization'])) {
        echo json_encode(["error" => "Missing token"]);
        exit;
    }

    $token = str_replace("Bearer ", "", $headers['Authorization']);
    $secretKey = 'your-secret-key';
    $decodedPayload = verifyJWT($token, $secretKey);

    if (!$decodedPayload || !isset($decodedPayload['uid'])) {
        echo json_encode(["error" => "Invalid or expired token"]);
        exit;
    }

    $userid = intval($decodedPayload['uid']);

    // Extract Form Data
    $modeOfTransport = htmlspecialchars($_POST["modeOfTransport"] ?? '');
    $emergencyContactPerson = htmlspecialchars($_POST["emergencyContactPerson"] ?? '');
    $emergencyContactNumber = htmlspecialchars($_POST["emergencyContactNumber"] ?? '');

    // Validate Required Fields
    if (!$modeOfTransport || !$emergencyContactPerson || !$emergencyContactNumber) {
        echo json_encode(["error" => "Missing required text fields"]);
        exit;
    }

    // Uploads directory
    $targetDir = "uploads/Documents/";

    // Upload Files
    $uploadedFiles = [];
    $fileFields = ["validId1", "validId2", "policeClearance", "barangayClearance"];
    $allowedTypes = ["jpg", "jpeg", "png", "pdf"];

    foreach ($fileFields as $field) {
        if (!isset($_FILES[$field])) {
            echo json_encode(["error" => "$field is missing"]);
            exit;
        }

        $fileName = uniqid() . "_" . basename($_FILES[$field]["name"]);
        $targetFilePath = $targetDir . $fileName;
        $fileType = strtolower(pathinfo($targetFilePath, PATHINFO_EXTENSION));

        if (!in_array($fileType, $allowedTypes)) {
            echo json_encode(["error" => "$field has an invalid file type"]);
            exit;
        }

        if (!move_uploaded_file($_FILES[$field]["tmp_name"], $targetFilePath)) {
            echo json_encode(["error" => "Failed to upload $field"]);
            exit;
        }

        $uploadedFiles[$field] = $fileName;
    }

    // Insert into Database
    $stmt = $conn->prepare("INSERT INTO runner_applications 
    (userid, valid_id_1, valid_id_2, police_clearance, barangay_clearance, mode_of_transport, emergency_contact_person, emergency_contact_number, status) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')");
    $stmt->bind_param("isssssss", 
        $userid, 
        $uploadedFiles["validId1"], 
        $uploadedFiles["validId2"], 
        $uploadedFiles["policeClearance"], 
        $uploadedFiles["barangayClearance"], 
        $modeOfTransport, 
        $emergencyContactPerson, 
        $emergencyContactNumber
    );

    if ($stmt->execute()) {
        echo json_encode(["message" => "Application submitted successfully"]);
    } else {
        echo json_encode(["error" => "Failed to submit application"]);
    }

    $stmt->close();
}



?>
