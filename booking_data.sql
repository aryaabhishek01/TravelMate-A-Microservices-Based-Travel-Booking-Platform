-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: localhost    Database: travelmate_booking
-- ------------------------------------------------------
-- Server version	8.0.41

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Dumping data for table `booking`
--

LOCK TABLES `booking` WRITE;
/*!40000 ALTER TABLE `booking` DISABLE KEYS */;
INSERT INTO `booking` (`id`, `days`, `destination`, `paid_amount`, `payment_status`, `people`, `status`, `total_amount`, `user_email`, `payment_id`, `booking_status`, `full_paid`, `start_date`, `travel_status`, `booked_slots`, `end_date`, `total_slots`, `package_id`, `is_custom`) VALUES (1,17,'Goa',20000,'PARTIAL',2,'BOOKED',22000,'arya@gmail.com',NULL,'CANCELLED',_binary '\0',NULL,'ONGOING',0,NULL,0,NULL,_binary '\0'),(2,7,'Goa',3000,'PARTIAL',2,'BOOKED',12000,'arya@gmail.com',NULL,NULL,_binary '\0',NULL,'NOT_STARTED',0,NULL,0,NULL,_binary '\0'),(3,7,'Dubai',22000,'FULL',2,NULL,22000,'arya@gmail.com',NULL,'CONFIRMED',_binary '',NULL,'NOT_STARTED',0,NULL,0,NULL,_binary '\0'),(4,7,'Goa',10000,'PARTIAL',2,NULL,12000,'aryashlok55@gmail.com',NULL,'CANCELLED',_binary '\0',NULL,'NOT_STARTED',-4,NULL,0,NULL,_binary '\0'),(5,9,'Goa',3000,'PARTIAL',2,NULL,10000,'arya@gmail.com',NULL,'CONFIRMED',_binary '\0',NULL,'NOT_STARTED',0,NULL,0,NULL,_binary '\0'),(6,5,'Goa',10000,'FULL',2,NULL,10000,'aryashlok55@gmail.com',NULL,'CONFIRMED',_binary '','2026-05-28','NOT_STARTED',1,'2026-06-02',15,NULL,_binary '\0'),(7,7,'Singapore Premium',75000,'PARTIAL',1,NULL,250000,'aryashlok55@gmail.com',NULL,'CANCELLED',_binary '\0','2026-05-01','ONGOING',1,'2026-05-08',15,NULL,_binary '\0'),(8,5,'Goa Package',3000,'PARTIAL',1,NULL,10000,'Shayam@gmail.com',NULL,'CONFIRMED',_binary '\0','2026-05-02','COMPLETED',0,'2026-05-06',15,1,_binary '\0'),(9,5,'Arunachal Pradesh',1500,'PARTIAL',1,NULL,5000,'peter@gmail.com',NULL,'CONFIRMED',_binary '\0','2026-05-03','COMPLETED',0,'2026-05-07',15,12,_binary '\0'),(10,5,'Goa Premium',4500,'PARTIAL',1,NULL,15000,'aryashlok55@gmail.com',NULL,'CONFIRMED',_binary '\0','2026-05-06','COMPLETED',0,'2026-05-10',15,2,_binary '\0'),(11,5,'Goa Package',6000,'PARTIAL',2,NULL,20000,'Ram@gmail.com',NULL,'CONFIRMED',_binary '\0','2026-05-06','COMPLETED',0,'2026-05-10',15,1,_binary '\0'),(12,6,'Jharkhand',4500,'PARTIAL',1,NULL,15000,'Ram@gmail.com',NULL,'CONFIRMED',_binary '\0','2026-05-06','COMPLETED',0,'2026-05-11',15,13,_binary '\0'),(13,5,'Kerala',4500,'PARTIAL',1,NULL,15000,'Shayam@gmail.com',NULL,'CONFIRMED',_binary '\0','2026-05-07','COMPLETED',0,'2026-05-11',15,14,_binary '\0'),(14,5,'Goa Package',3000,'PARTIAL',1,NULL,10000,'Shayam@gmail.com',NULL,'CONFIRMED',_binary '\0','2026-05-07','COMPLETED',0,'2026-05-11',15,1,_binary '\0'),(15,8,'Goa',4500,'PARTIAL',1,NULL,15000,'aryashlok55@gmail.com',NULL,'CONFIRMED',_binary '\0','2026-05-09','ONGOING',0,'2026-05-16',15,15,_binary '\0');
/*!40000 ALTER TABLE `booking` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-19  7:29:53
