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
            ? "https://sibatapi2.loophole.site/CAPSTONE/backend/uploads/" . $user['profilepic']
            : "https://sibatapi2.loophole.site/CAPSTONE/backend/uploads/default_profile.png";

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
            ? "https://sibatapi2.loophole.site/CAPSTONE/backend/uploads/" . $row['profilepic']
            : "https://sibatapi2.loophole.site/CAPSTONE/backend/uploads/default_profile.png";

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
        CONCAT('https://sibatapi2.loophole.site/capstone/backend/uploads/Documents/', valid_id_1) AS valid_id_1_url,
        CONCAT('https://sibatapi2.loophole.site/capstone/backend/uploads/Documents/', valid_id_2) AS valid_id_2_url,
        CONCAT('https://sibatapi2.loophole.site/capstone/backend/uploads/Documents/', police_clearance) AS police_clearance_url,
        CONCAT('https://sibatapi2.loophole.site/capstone/backend/uploads/Documents/', barangay_clearance) AS barangay_clearance_url
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


function checkErrandStatus() {
    global $conn;

    // Get the errand ID from the request
    $errandId = intval($_GET['errand_id'] ?? 0);

    if ($errandId === 0) {
        echo json_encode(["error" => "Invalid errand ID"]);
        exit;
    }

    // Query the database for the errand's status
    $stmt = $conn->prepare("SELECT is_accepted FROM errands WHERE errand_id = ?");
    $stmt->bind_param("i", $errandId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        echo json_encode(["is_accepted" => $row['is_accepted']]);
    } else {
        echo json_encode(["error" => "Errand not found"]);
    }

    $stmt->close();
}



function getErrands() {
    global $conn;

    // Query to fetch all errands
    $result = $conn->query("SELECT * FROM errands ORDER BY created_at DESC");

    $errands = [];
    while ($row = $result->fetch_assoc()) {
        $errands[] = $row;
    }

    echo json_encode($errands);
}

 
function getChatHistory() {
    global $conn;

    // Get the logged-in user's ID from the token
    $headers = getallheaders();
    if (!isset($headers['Authorization'])) {
        echo json_encode(["error" => "Missing token"]);
        exit;
    }

    $token = str_replace("Bearer ", "", $headers['Authorization']);
    $decodedPayload = verifyJWT($token, 'your-secret-key');
    if (!$decodedPayload || !isset($decodedPayload['uid'])) {
        echo json_encode(["error" => "Invalid or expired token"]);
        exit;
    }

    $userId = intval($decodedPayload['uid']);

    // Fetch chat history for the user, including the latest message details and errand_id
    $stmt = $conn->prepare("
        SELECT 
            c.id AS chat_id, 
            CASE 
                WHEN c.runner_id = ? THEN u2.first_name 
                ELSE u1.first_name 
            END AS name,
            c.errand_id,
            c.runner_id,
            c.user_id,
            c.status,
            m.content AS latest_message,
            m.type AS latest_message_type,
            m.filename AS latest_message_filename,
            m.created_at AS latest_message_time
        FROM chats c
        JOIN users u1 ON c.runner_id = u1.userid
        JOIN users u2 ON c.user_id = u2.userid
        LEFT JOIN messages m ON m.chat_id = c.id
        WHERE c.runner_id = ? OR c.user_id = ?
        GROUP BY c.id
        ORDER BY MAX(m.created_at) DESC
    ");
    $stmt->bind_param("iii", $userId, $userId, $userId);
    $stmt->execute();
    $result = $stmt->get_result();

    $chatHistory = [];
    while ($row = $result->fetch_assoc()) {
        $chatHistory[] = $row;
    }

    echo json_encode($chatHistory);
    $stmt->close();
}

 
 function getMessages() {
    global $conn;

    // Get the chat ID from the query parameters
    $chatId = intval($_GET['chatId'] ?? 0);
    if ($chatId === 0) {
        echo json_encode(["error" => "Invalid chat ID"]);
        exit;
    }

    // Fetch messages for the chat
    $stmt = $conn->prepare("
    SELECT m.id AS message_id, 
           m.sender_id, 
           u.first_name AS sender, 
           m.content, 
           m.type,
              m.filename,
           m.created_at
    FROM messages m
    JOIN users u ON m.sender_id = u.userid
    WHERE m.chat_id = ?
    ORDER BY m.created_at ASC
");
    $stmt->bind_param("i", $chatId);
    $stmt->execute();
    $result = $stmt->get_result();

    $messages = [];
    while ($row = $result->fetch_assoc()) {
        $messages[] = $row; // Ensure sender_id and sender (first_name) are included
    }

    echo json_encode($messages); // Return the messages as JSON
    $stmt->close();
}

function isRunner($userid) {
    global $conn;

    $stmt = $conn->prepare("SELECT role FROM users WHERE userid = ?");
    $stmt->bind_param("i", $userid);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        return false;
    }

    $user = $result->fetch_assoc();
    return $user['role'] === 'runner';
}

function getIsRunner() {
    global $conn;

    // Get the Authorization header from the request
    $headers = getallheaders();
    if (!isset($headers['Authorization'])) {
        echo json_encode(["error" => "Missing token"]);
        exit;
    }

    // Extract token from "Bearer <token>"
    $token = str_replace("Bearer ", "", $headers['Authorization']);
    $secretKey = 'your-secret-key'; // Use your actual secret key

    // Verify the token
    $decodedPayload = verifyJWT($token, $secretKey);

    if (!$decodedPayload || !isset($decodedPayload['uid'])) {
        echo json_encode(["error" => "Invalid or expired token"]);
        exit;
    }

    $userid = intval($decodedPayload['uid']);
    $result = isRunner($userid);

    echo json_encode(["isRunner" => $result]);
}


function isUser($userid) {
    global $conn;

    $stmt = $conn->prepare("SELECT role FROM users WHERE userid = ?");
    $stmt->bind_param("i", $userid);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        return false;
    }

    $user = $result->fetch_assoc();
    return $user['role'] === 'user';
}
 
function getIsUser() {
    global $conn;

    // Get the Authorization header from the request
    $headers = getallheaders();
    if (!isset($headers['Authorization'])) {
        echo json_encode(["error" => "Missing token"]);
        exit;
    }

    // Extract token from "Bearer <token>"
    $token = str_replace("Bearer ", "", $headers['Authorization']);
    $secretKey = 'your-secret-key'; // Use your actual secret key

    // Verify the token
    $decodedPayload = verifyJWT($token, $secretKey);

    if (!$decodedPayload || !isset($decodedPayload['uid'])) {
        echo json_encode(["error" => "Invalid or expired token"]);
        exit;
    }

    $userid = intval($decodedPayload['uid']);
    $result = isUser($userid);

    echo json_encode([
        "isUser" => $result,
        "userId" => $result ? $userid : null
    ]);
}

function getErrandDetails() {
    global $conn;

    // Get the errand ID from the request
    $errandId = intval($_GET['errand_id'] ?? 0);

    if ($errandId === 0) {
        echo json_encode(["error" => "Invalid errand ID"]);
        exit;
    }

    // Get the Authorization header from the request
    $headers = getallheaders();
    if (!isset($headers['Authorization'])) {
        echo json_encode(["error" => "Missing token"]);
        exit;
    }

    // Extract token from "Bearer <token>"
    $token = str_replace("Bearer ", "", $headers['Authorization']);
    $secretKey = 'your-secret-key'; // Use your actual secret key

    // Verify the token
    $decodedPayload = verifyJWT($token, $secretKey);

    if (!$decodedPayload || !isset($decodedPayload['uid'])) {
        echo json_encode(["error" => "Invalid or expired token"]);
        exit;
    }

    $userId = intval($decodedPayload['uid']);

    // Fetch the errand details along with user and runner information
    $stmt = $conn->prepare("SELECT e.*, 
                            u.first_name as user_first_name, u.last_name as user_last_name, 
                            r.first_name as runner_first_name, r.last_name as runner_last_name
                            FROM errands e 
                            LEFT JOIN users u ON e.userid = u.userid
                            LEFT JOIN users r ON e.runner_id = r.userid
                            WHERE e.errand_id = ?");
    $stmt->bind_param("i", $errandId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        echo json_encode(["error" => "Errand not found"]);
        exit;
    }

    $errand = $result->fetch_assoc();

    // Format the response data
    $response = [
        'errand_id' => $errand['errand_id'],
        'title' => $errand['title'],
        'description' => $errand['description'],
        'location' => $errand['location'],
        'payment' => $errand['payment'],
        'status' => $errand['status'],
        'user_id' => $errand['user_id'],
        'runner_id' => $errand['runner_id'],
        'user_name' => $errand['user_first_name'] . ' ' . $errand['user_last_name'],
        'runner_name' => $errand['runner_first_name'] ? $errand['runner_first_name'] . ' ' . $errand['runner_last_name'] : null,
        'created_at' => $errand['created_at'],
        'updated_at' => $errand['updated_at']
    ];

    echo json_encode($response);
    $stmt->close();
}









?>
