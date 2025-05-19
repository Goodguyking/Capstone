-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 17, 2025 at 10:17 PM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `sibat`
--

-- --------------------------------------------------------

--
-- Table structure for table `chats`
--

CREATE TABLE `chats` (
  `id` int(11) NOT NULL,
  `runner_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` varchar(20) DEFAULT 'ongoing',
  `rating` int(11) DEFAULT NULL,
  `rate_notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `chats`
--

INSERT INTO `chats` (`id`, `runner_id`, `user_id`, `created_at`, `status`, `rating`, `rate_notes`) VALUES
(9, 8, 9, '2025-05-16 20:02:12', 'ongoing', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `chat_history`
--

CREATE TABLE `chat_history` (
  `history_id` int(11) NOT NULL,
  `chat_id` int(11) NOT NULL,
  `runner_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `status` varchar(20) DEFAULT 'done',
  `rating` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `rate_notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `chat_history`
--

INSERT INTO `chat_history` (`history_id`, `chat_id`, `runner_id`, `user_id`, `status`, `rating`, `created_at`, `updated_at`, `rate_notes`) VALUES
(9, 7, 8, 9, 'done', NULL, '2025-05-17 03:53:02', NULL, NULL),
(10, 8, 8, 9, 'done', 5, '2025-05-17 03:59:08', NULL, 'great');

-- --------------------------------------------------------

--
-- Table structure for table `errands`
--

CREATE TABLE `errands` (
  `errand_id` int(11) NOT NULL,
  `userid` int(11) NOT NULL,
  `collecting_location` varchar(255) NOT NULL,
  `task_description` text NOT NULL,
  `tip` decimal(10,2) DEFAULT 0.00,
  `delivery_location` varchar(255) NOT NULL,
  `base_price` decimal(10,2) NOT NULL,
  `service_charge` decimal(10,2) NOT NULL,
  `delivery_charge` decimal(10,2) NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `is_accepted` tinyint(1) DEFAULT 0,
  `runner_id` int(11) DEFAULT NULL,
  `status` enum('On Going','Canceled','Done') DEFAULT 'On Going',
  `rating` int(11) DEFAULT NULL,
  `user_done` tinyint(1) DEFAULT 0,
  `runner_done` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `errands`
--

INSERT INTO `errands` (`errand_id`, `userid`, `collecting_location`, `task_description`, `tip`, `delivery_location`, `base_price`, `service_charge`, `delivery_charge`, `total_price`, `created_at`, `is_accepted`, `runner_id`, `status`, `rating`, `user_done`, `runner_done`) VALUES
(7, 9, 'Sm central', 'buy me coffee', 200.00, 'sta rita', 100.00, 5.00, 50.00, 355.00, '2025-04-19 03:50:13', 1, 8, 'On Going', NULL, 0, 0),
(8, 9, 'Sm central', 'but me flowerss', 50.00, 'west tapinac 14th st. ', 100.00, 5.00, 50.00, 205.00, '2025-04-20 14:39:19', 1, 8, 'On Going', NULL, 0, 0),
(9, 9, 'sm downtown', 'buy me donuts', 100.00, '25th st', 100.00, 5.00, 50.00, 255.00, '2025-04-20 14:50:43', 1, 8, 'On Going', NULL, 0, 0),
(10, 10, 'mercurydrug sm downtown', 'bili mo ko gamot sa mercury drug sa sm downtown', 50.00, 'Kanto manggahan st. sta rita', 100.00, 5.00, 50.00, 205.00, '2025-05-01 22:33:26', 1, 8, 'On Going', NULL, 0, 0),
(11, 9, 'sm downtown', 'buy me flowers', 100.00, '14th west tapinac', 100.00, 5.00, 50.00, 255.00, '2025-05-14 23:10:34', 1, 8, 'On Going', NULL, 0, 0),
(12, 9, 'sm downtown', 'buy me coffee', 20.00, '14th west tapinac', 100.00, 5.00, 50.00, 175.00, '2025-05-16 03:51:58', 1, 8, 'On Going', NULL, 0, 0),
(13, 9, 'mercurydrug sm downtown', 'buy me biogesic', 20.00, '14th west tapinac', 100.00, 5.00, 50.00, 175.00, '2025-05-16 03:57:29', 1, 8, 'On Going', NULL, 0, 0),
(14, 10, 'sm downtown', 'buy me flowers', 20.00, '14th west tapinac', 100.00, 5.00, 50.00, 175.00, '2025-05-16 04:33:43', 1, 8, 'On Going', NULL, 0, 0),
(15, 9, 'sm downtown', 'buy me coffee', 200.00, '14th west tapinac', 100.00, 5.00, 50.00, 355.00, '2025-05-17 03:28:14', 1, 8, 'On Going', NULL, 0, 0),
(16, 9, 'sm downtown', 'buy me coffee', 200.00, '14th west tapinac', 100.00, 5.00, 50.00, 355.00, '2025-05-17 03:52:56', 1, 8, 'On Going', NULL, 0, 0),
(17, 9, 'sm downtown', 'buy me coffee', 100.00, '14th west tapinac', 100.00, 5.00, 50.00, 255.00, '2025-05-17 03:59:03', 1, 8, 'On Going', NULL, 0, 0),
(18, 9, 'sm downtown', 'buy me coffee', 100.00, 'Kanto manggahan st. sta rita', 100.00, 5.00, 50.00, 255.00, '2025-05-17 04:02:06', 1, 8, 'On Going', NULL, 0, 0),
(19, 9, 'sm downtown', 'buy me flowers', 100.00, '25th st', 100.00, 5.00, 50.00, 255.00, '2025-05-17 04:57:23', 1, 8, 'On Going', NULL, 0, 0);

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `id` int(11) NOT NULL,
  `chat_id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `content` text NOT NULL,
  `type` enum('text','image') DEFAULT 'text',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `filename` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `messages`
--

INSERT INTO `messages` (`id`, `chat_id`, `sender_id`, `content`, `type`, `created_at`, `filename`) VALUES
(432, 9, 8, 'hello', 'text', '2025-05-16 20:02:16', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `messages_history`
--

CREATE TABLE `messages_history` (
  `id` int(11) NOT NULL,
  `chat_id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `content` text NOT NULL,
  `type` enum('text','image') DEFAULT 'text',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `filename` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `messages_history`
--

INSERT INTO `messages_history` (`id`, `chat_id`, `sender_id`, `content`, `type`, `created_at`, `filename`) VALUES
(409, 2, 8, 'hello', 'text', '2025-05-01 14:33:49', NULL),
(410, 2, 10, 'hello sir', 'text', '2025-05-01 14:33:59', NULL),
(411, 2, 8, 'otw na po ako sir', 'text', '2025-05-01 14:34:09', NULL),
(413, 2, 8, '', 'image', '2025-05-01 14:34:20', '1746110060081-408a736e-df19-45fe-be6d-71cef3ecea68.mp4'),
(414, 2, 8, '', 'image', '2025-05-01 14:34:52', '1746110092174-371910895_330738259316669_4528164725036732094_n.jpg'),
(415, 2, 10, 'HAHAHA', 'text', '2025-05-05 11:20:51', NULL),
(416, 2, 10, 'hello', 'text', '2025-05-05 11:24:36', NULL),
(417, 2, 10, '', 'image', '2025-05-05 11:24:57', '1746444297306-2ahii9oe2o881.gif'),
(418, 1, 8, 'hello?', 'text', '2025-05-14 15:07:47', NULL),
(419, 1, 8, 'Errand Done', 'text', '2025-05-14 15:27:47', NULL),
(420, 1, 8, 'Errand Done', 'text', '2025-05-14 15:27:48', NULL),
(421, 1, 8, 's', 'text', '2025-05-14 16:27:43', NULL),
(422, 3, 9, 'hello', 'text', '2025-05-15 19:52:21', NULL),
(423, 4, 9, 'asd', 'text', '2025-05-15 19:57:47', NULL),
(424, 4, 9, 'hello', 'text', '2025-05-15 20:07:28', NULL),
(425, 4, 9, 'otw na po', 'text', '2025-05-15 20:07:29', NULL),
(426, 4, 9, 'ako', 'text', '2025-05-15 20:07:31', NULL),
(427, 4, 9, 'sir', 'text', '2025-05-15 20:07:32', NULL),
(428, 4, 9, '', 'image', '2025-05-15 20:07:39', '1747339659808-200w.gif'),
(429, 5, 10, 'asd', 'text', '2025-05-15 20:33:54', NULL),
(430, 7, 9, 'hello', 'text', '2025-05-16 19:53:13', NULL),
(431, 8, 8, 'hello', 'text', '2025-05-16 19:59:11', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `runner_applications`
--

CREATE TABLE `runner_applications` (
  `application_id` int(11) NOT NULL,
  `userid` int(11) NOT NULL,
  `valid_id_1` varchar(255) NOT NULL,
  `valid_id_2` varchar(255) NOT NULL,
  `police_clearance` varchar(255) NOT NULL,
  `barangay_clearance` varchar(255) NOT NULL,
  `mode_of_transport` enum('bicycle','motorcycle','car','on-foot') NOT NULL,
  `emergency_contact_person` varchar(100) NOT NULL,
  `emergency_contact_number` varchar(15) NOT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `submission_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `runner_applications`
--

INSERT INTO `runner_applications` (`application_id`, `userid`, `valid_id_1`, `valid_id_2`, `police_clearance`, `barangay_clearance`, `mode_of_transport`, `emergency_contact_person`, `emergency_contact_number`, `status`, `submission_date`) VALUES
(32, 8, '67f9154583eb5_123.png', '67f91545842ae_760b9d39-335a-4516-864d-371c0a7ba5ec.jpeg', '67f915458475d_12341234.pdf', '67f91545849c2_12341234.pdf', 'on-foot', 'erika', '123456789', 'approved', '2025-04-11 13:12:37');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `userid` int(11) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('user','runner','admin') NOT NULL,
  `verification_code` varchar(6) DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT 0,
  `location` varchar(255) NOT NULL,
  `profilepic` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`userid`, `first_name`, `last_name`, `username`, `email`, `contact_number`, `password`, `role`, `verification_code`, `is_verified`, `location`, `profilepic`) VALUES
(7, 'admin', 'admin', 'admin', 'Admin@example.com', '09661385430', '$2y$10$L8G1upQoFHFP4El19hgKd.m.SOc08ltZapLCdUH5wE1J3D8pqoOxa', 'admin', NULL, 1, '', '123.png'),
(8, 'King', 'Agnas', 'kingagnas21', 'agnasking21@gmail.com', '09661385430', '$2y$10$i4Ckdx4Q3YO0JaXH6VoGHeKe9l8xfsMWjbQtIUK6ujOk0f7U4mmj2', 'runner', NULL, 1, 'Sta rita', 'received_697644291460381.jpeg'),
(9, 'Erika', 'Evangelista', 'kingagnas', '201811522@gordoncollege.edu.ph', '09661385430', '$2y$10$ciXpU1I0ZPdmkdGDmoRNI.PQxHPg/Le5BcAB/iNKs28RPODU2Xcey', 'user', NULL, 1, 'OC', '300956961_507288531396316_7842861852187531276_n.jpg'),
(10, 'Denzel', 'Sixto', 'Zeld', 'zeld@sample.com', '0934567891', '$2y$10$iWrI6k47G9kMB4bY3/3xI.Vcd1nKDy6pSy0bZFit2KBRAKU2Q5glu', 'user', NULL, 1, '', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `chats`
--
ALTER TABLE `chats`
  ADD PRIMARY KEY (`id`),
  ADD KEY `runner_id` (`runner_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `chat_history`
--
ALTER TABLE `chat_history`
  ADD PRIMARY KEY (`history_id`),
  ADD KEY `runner_id` (`runner_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `errands`
--
ALTER TABLE `errands`
  ADD PRIMARY KEY (`errand_id`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `chat_id` (`chat_id`),
  ADD KEY `sender_id` (`sender_id`);

--
-- Indexes for table `messages_history`
--
ALTER TABLE `messages_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `chat_id` (`chat_id`),
  ADD KEY `sender_id` (`sender_id`);

--
-- Indexes for table `runner_applications`
--
ALTER TABLE `runner_applications`
  ADD PRIMARY KEY (`application_id`),
  ADD KEY `userid` (`userid`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`userid`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `chats`
--
ALTER TABLE `chats`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `chat_history`
--
ALTER TABLE `chat_history`
  MODIFY `history_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `errands`
--
ALTER TABLE `errands`
  MODIFY `errand_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=433;

--
-- AUTO_INCREMENT for table `messages_history`
--
ALTER TABLE `messages_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=432;

--
-- AUTO_INCREMENT for table `runner_applications`
--
ALTER TABLE `runner_applications`
  MODIFY `application_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `userid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `chats`
--
ALTER TABLE `chats`
  ADD CONSTRAINT `chats_ibfk_1` FOREIGN KEY (`runner_id`) REFERENCES `users` (`userid`),
  ADD CONSTRAINT `chats_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`userid`);

--
-- Constraints for table `chat_history`
--
ALTER TABLE `chat_history`
  ADD CONSTRAINT `chat_history_ibfk_1` FOREIGN KEY (`runner_id`) REFERENCES `users` (`userid`),
  ADD CONSTRAINT `chat_history_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`userid`);

--
-- Constraints for table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`chat_id`) REFERENCES `chats` (`id`),
  ADD CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`userid`);

--
-- Constraints for table `runner_applications`
--
ALTER TABLE `runner_applications`
  ADD CONSTRAINT `runner_applications_ibfk_1` FOREIGN KEY (`userid`) REFERENCES `users` (`userid`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
