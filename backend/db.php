<?php
$host = "localhost";  // Change this if using a different host
$username = "root";   // Your MySQL username
$password = "";       // Your MySQL password (leave blank if none)
$database = "sibat";  // Your database name

// Create connection
$conn = new mysqli($host, $username, $password, $database);

// Check connection
if ($conn->connect_error) {
    die(json_encode(["status" => "error", "message" => "Connection failed: " . $conn->connect_error]));
}

// If connected successfully, return a success response
header("Content-Type: application/json");
?>
