<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS, DELETE"); // Add DELETE here
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
    case 'getAllUsers':
        require_once 'routes/get.php';
        getAllUsers();
        break;
        
    case 'deleteUser':
        require_once 'routes/post.php';
        deleteUser();
        break;

    case 'editUser':
        require_once 'routes/post.php';
        editUser();
        break;
    case 'changePassword':
        require_once 'routes/post.php';
        changePassword();
        break;    
    case 'getRunnerApplications':
        require_once 'routes/get.php';
        getRunnerApplications();
        break;
    case 'approveApplication':
        require_once 'routes/post.php';
        approveApplication();
        break;
    case 'rejectApplication':
        require_once 'routes/post.php';
        rejectApplication();
        break;

    case 'createErrand':
        require_once 'routes/post.php';
        createErrand();
        break;
    case 'checkErrandStatus':
        require_once 'routes/get.php';
        checkErrandStatus();
        break;
    case 'getErrands':
        require_once 'routes/get.php';
        getErrands();
        break;        
    case 'acceptErrand':
        require_once 'routes/post.php';
        acceptErrand();
        break;
        
    case 'getChatHistory':
        require_once 'routes/get.php';
        getChatHistory();
        break;
        
    case 'getMessages':
        require_once 'routes/get.php';
        getMessages();
        break;



        

        default:
        echo json_encode(["error" => "Invalid route"]);
        break;
}
?>
