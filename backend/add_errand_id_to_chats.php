<?php
// Include database connection
include './routes/db.php';

// SQL to add errand_id column to chats table
$sql = "ALTER TABLE chats 
        ADD COLUMN errand_id INT NULL,
        ADD CONSTRAINT fk_errand_id
        FOREIGN KEY (errand_id) 
        REFERENCES errands(errand_id) 
        ON DELETE SET NULL";

// Execute the query
if ($conn->query($sql) === TRUE) {
    echo "Column errand_id added to chats table successfully";
} else {
    echo "Error adding column: " . $conn->error;
}

// Close the connection
$conn->close();
?> 