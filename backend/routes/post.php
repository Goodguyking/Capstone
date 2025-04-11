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

function deleteUser() {
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

    // Get the user ID to delete
    $userIdToDelete = intval($_GET['userid'] ?? 0);
    if ($userIdToDelete === 0) {
        echo json_encode(["error" => "Invalid user ID"]);
        exit;
    }

    // Delete the user
    $stmt = $conn->prepare("DELETE FROM users WHERE userid = ?");
    $stmt->bind_param("i", $userIdToDelete);
    if ($stmt->execute()) {
        echo json_encode(["message" => "User deleted successfully"]);
    } else {
        echo json_encode(["error" => "Failed to delete user"]);
    }

    $stmt->close();
}

function editUser() {
    global $conn;

    // Check if the request method is POST
    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        echo json_encode(["error" => "Invalid request method"]);
        exit;
    }

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

    // Get the JSON payload
    $data = json_decode(file_get_contents("php://input"), true);

    if (!$data || !isset($data['userid'])) {
        echo json_encode(["error" => "Invalid input data"]);
        exit;
    }

    $userIdToEdit = intval($data['userid']);
    $firstName = $data['first_name'] ?? null;
    $lastName = $data['last_name'] ?? null;
    $email = $data['email'] ?? null;
    $contactNumber = $data['contact_number'] ?? null;
    $role = $data['role'] ?? null;
    $location = $data['location'] ?? null;

    // Validate required fields
    if (!$firstName || !$lastName || !$email || !$role) {
        echo json_encode(["error" => "Missing required fields"]);
        exit;
    }

    // Update the user's details in the database
    $stmt = $conn->prepare("UPDATE users SET first_name = ?, last_name = ?, email = ?, contact_number = ?, role = ?, location = ? WHERE userid = ?");
    $stmt->bind_param("ssssssi", $firstName, $lastName, $email, $contactNumber, $role, $location, $userIdToEdit);

    if ($stmt->execute()) {
        echo json_encode(["message" => "User updated successfully"]);
    } else {
        echo json_encode(["error" => "Failed to update user"]);
    }

    $stmt->close();
}


function changePassword() {
    global $conn;

    // Check if the request method is POST
    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        echo json_encode(["error" => "Invalid request method"]);
        exit;
    }

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

    // Get the JSON payload
    $data = json_decode(file_get_contents("php://input"), true);

    if (!$data || !isset($data['userid']) || !isset($data['new_password'])) {
        echo json_encode(["error" => "Invalid input data"]);
        exit;
    }

    $userIdToUpdate = intval($data['userid']);
    $newPassword = password_hash($data['new_password'], PASSWORD_BCRYPT);

    // Update the user's password in the database
    $stmt = $conn->prepare("UPDATE users SET password = ? WHERE userid = ?");
    $stmt->bind_param("si", $newPassword, $userIdToUpdate);

    if ($stmt->execute()) {
        echo json_encode(["message" => "Password updated successfully"]);
    } else {
        echo json_encode(["error" => "Failed to update password"]);
    }

    $stmt->close();
}

function approveApplication() {
    global $conn;

    // Check if the request method is POST
    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        echo json_encode(["error" => "Invalid request method"]);
        exit;
    }

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

    // Get the JSON payload
    $data = json_decode(file_get_contents("php://input"), true);

    if (!$data || !isset($data['application_id']) || !isset($data['userid'])) {
        echo json_encode(["error" => "Invalid input data"]);
        exit;
    }

    $applicationId = intval($data['application_id']);
    $userId = intval($data['userid']);

    // Update the application status to "approved"
    $stmt = $conn->prepare("UPDATE runner_applications SET status = 'approved' WHERE application_id = ?");
    $stmt->bind_param("i", $applicationId);

    if ($stmt->execute()) {
        // Update the user's role to "runner"
        $stmt = $conn->prepare("UPDATE users SET role = 'runner' WHERE userid = ?");
        $stmt->bind_param("i", $userId);
        $stmt->execute();

        echo json_encode(["message" => "Application approved and user role updated to runner"]);
    } else {
        echo json_encode(["error" => "Failed to approve application"]);
    }

    $stmt->close();
}

function rejectApplication() {
    global $conn;

    // Check if the request method is POST
    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        echo json_encode(["error" => "Invalid request method"]);
        exit;
    }

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

    // Get the JSON payload
    $data = json_decode(file_get_contents("php://input"), true);

    if (!$data || !isset($data['application_id'])) {
        echo json_encode(["error" => "Invalid input data"]);
        exit;
    }

    $applicationId = intval($data['application_id']);

    // Update the application status to "rejected"
    $stmt = $conn->prepare("UPDATE runner_applications SET status = 'rejected' WHERE application_id = ?");
    $stmt->bind_param("i", $applicationId);

    if ($stmt->execute()) {
        echo json_encode(["message" => "Application rejected"]);
    } else {
        echo json_encode(["error" => "Failed to reject application"]);
    }

    $stmt->close();
}








?>
