<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$requestUri = $_GET['route'] ?? '';

switch ($requestUri) {
    case 'auth/login':
        require_once 'routes/auth.php';
        handleLogin();
        break;

    case 'auth/register':
        require_once 'routes/auth.php';
        handleRegister();
        break;

    case 'verify-email':
        require_once 'routes/auth.php';
        handleVerifyCode();
        break;

    case 'getUserData':
        require_once 'routes/get.php';
        getUserData();
        break;

    case 'uploadProfilePic':
        require_once 'routes/post.php';
        uploadProfilePic();
        break;
    case 'updateUserProfile':
        require_once 'routes/post.php';
        updateUserProfile();
        break;
    case 'applyAsRunner':
        require_once 'routes/post.php';
        applyAsRunner();
        break;
        


        
        default:
        echo json_encode(["error" => "Invalid route"]);
        break;
}
?>
