-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: localhost    Database: travelmate_trip
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
-- Dumping data for table `packages`
--

LOCK TABLES `packages` WRITE;
/*!40000 ALTER TABLE `packages` DISABLE KEYS */;
INSERT INTO `packages` (`id`, `duration`, `name`, `price`, `type`, `booked_slots`, `total_slots`, `destination_type`, `owner_email`) VALUES (1,5,'Goa Package',10000,'DEFAULT',0,15,'NATIONAL',NULL),(2,5,'Goa Premium',15000,'DEFAULT',0,15,'NATIONAL',NULL),(3,5,'Dubai Trip',120000,'DEFAULT',0,15,'INTERNATIONAL',NULL),(4,5,'Dubai Premium',200000,'DEFAULT',0,15,'INTERNATIONAL',NULL),(8,5,'Chennai Trip',20000,'DEFAULT',0,15,'NATIONAL',NULL),(9,7,'Singapore Premium',250000,'DEFAULT',0,15,'INTERNATIONAL',NULL),(11,5,'Gujarat',8000,'DEFAULT',0,15,'NATIONAL',NULL),(12,5,'Arunachal Pradesh – 5d Custom',5000,'CUSTOM',0,15,'NATIONAL','peter@gmail.com'),(13,6,'Jharkhand – 6d Custom',15000,'CUSTOM',0,15,'NATIONAL','Ram@gmail.com'),(14,5,'Kerala – 5d Custom',15000,'CUSTOM',0,15,'NATIONAL','Shayam@gmail.com'),(15,8,'Goa – 8d Custom',15000,'CUSTOM',0,15,'NATIONAL','aryashlok55@gmail.com');
/*!40000 ALTER TABLE `packages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `destination`
--

LOCK TABLES `destination` WRITE;
/*!40000 ALTER TABLE `destination` DISABLE KEYS */;
/*!40000 ALTER TABLE `destination` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `itinerary`
--

LOCK TABLES `itinerary` WRITE;
/*!40000 ALTER TABLE `itinerary` DISABLE KEYS */;
/*!40000 ALTER TABLE `itinerary` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `slot_records`
--

LOCK TABLES `slot_records` WRITE;
/*!40000 ALTER TABLE `slot_records` DISABLE KEYS */;
/*!40000 ALTER TABLE `slot_records` ENABLE KEYS */;
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
