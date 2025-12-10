-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: localhost    Database: testing_db
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `product_test_parameters`
--

DROP TABLE IF EXISTS `product_test_parameters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_test_parameters` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `test_type_id` int NOT NULL,
  `parameter_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `parameter_value` text COLLATE utf8mb4_unicode_ci,
  `parameter_unit` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lsl` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `usl` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `validation_type` enum('lsl_usl','pass_fail','reference') COLLATE utf8mb4_unicode_ci DEFAULT 'lsl_usl',
  `display_order` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `test_type_id` (`test_type_id`),
  KEY `idx_product_test_params` (`product_id`,`test_type_id`,`display_order`),
  CONSTRAINT `fk_product_test_parameters_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `product_test_parameters_ibfk_2` FOREIGN KEY (`test_type_id`) REFERENCES `test_types` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_test_parameters`
--

LOCK TABLES `product_test_parameters` WRITE;
/*!40000 ALTER TABLE `product_test_parameters` DISABLE KEYS */;
INSERT INTO `product_test_parameters` VALUES (18,7,1,'Test','00000000','Test',NULL,NULL,'reference',1,'2025-11-18 06:24:43'),(22,10,1,'V','test',NULL,NULL,NULL,'reference',1,'2025-11-24 09:14:47'),(23,10,1,'Fr','TEst',NULL,NULL,NULL,'reference',2,'2025-11-24 09:14:47'),(24,10,2,'X','TEst',NULL,NULL,NULL,'reference',1,'2025-11-24 09:14:47'),(25,10,2,'Z','TESt',NULL,NULL,NULL,'reference',2,'2025-11-24 09:14:47'),(26,11,1,'Vin Trigger','170',NULL,NULL,NULL,'reference',1,'2025-11-28 01:27:22'),(27,11,2,'T input','20pps',NULL,NULL,NULL,'reference',1,'2025-11-28 01:27:22'),(28,12,1,'test','123123',NULL,NULL,NULL,'lsl_usl',1,'2025-12-01 08:32:05'),(29,12,1,'test2','12311231123',NULL,NULL,NULL,'lsl_usl',2,'2025-12-01 08:32:05'),(30,12,1,'test3','12312123',NULL,NULL,NULL,'lsl_usl',3,'2025-12-01 08:32:05'),(31,12,2,'test','12312123',NULL,NULL,NULL,'lsl_usl',1,'2025-12-01 08:32:05'),(32,12,2,'test2','1231312',NULL,NULL,NULL,'lsl_usl',2,'2025-12-01 08:32:05'),(33,12,2,'test3','123454321',NULL,NULL,NULL,'lsl_usl',3,'2025-12-01 08:32:05');
/*!40000 ALTER TABLE `product_test_parameters` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_test_sequence`
--

DROP TABLE IF EXISTS `product_test_sequence`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_test_sequence` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `test_type_id` int NOT NULL,
  `sequence_order` int NOT NULL,
  `is_required` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_product_test` (`product_id`,`test_type_id`),
  KEY `test_type_id` (`test_type_id`),
  KEY `idx_product_sequence` (`product_id`,`sequence_order`),
  CONSTRAINT `fk_product_test_sequence_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `product_test_sequence_ibfk_2` FOREIGN KEY (`test_type_id`) REFERENCES `test_types` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_test_sequence`
--

LOCK TABLES `product_test_sequence` WRITE;
/*!40000 ALTER TABLE `product_test_sequence` DISABLE KEYS */;
INSERT INTO `product_test_sequence` VALUES (6,6,1,1,1,'2025-11-18 02:36:53'),(7,6,2,2,1,'2025-11-18 02:36:53'),(12,10,1,1,1,'2025-11-24 09:14:47'),(13,10,2,2,1,'2025-11-24 09:14:47'),(14,11,1,1,1,'2025-11-28 01:27:22'),(15,11,2,2,1,'2025-11-28 01:27:22'),(16,12,1,1,1,'2025-12-01 08:32:05'),(17,12,2,2,1,'2025-12-01 08:32:05');
/*!40000 ALTER TABLE `product_test_sequence` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `series_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `series` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_product_name` (`product_name`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (6,'Litepac','1101','201',1,'2025-11-18 02:36:53'),(7,'Test','0000','0000',1,'2025-11-18 06:24:43'),(10,'Litepac','1150','201',1,'2025-11-24 09:14:47'),(11,'Litepac','1160','201',1,'2025-11-28 01:27:22'),(12,'Sub-system','6517-30','502',1,'2025-12-01 08:32:05');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `templates`
--

DROP TABLE IF EXISTS `templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `templates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `test_type_id` int NOT NULL,
  `template_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `custom_columns` json NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_template` (`product_id`,`test_type_id`),
  KEY `test_type_id` (`test_type_id`),
  KEY `idx_product_test` (`product_id`,`test_type_id`),
  CONSTRAINT `fk_templates_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `templates_ibfk_2` FOREIGN KEY (`test_type_id`) REFERENCES `test_types` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `templates`
--

LOCK TABLES `templates` WRITE;
/*!40000 ALTER TABLE `templates` DISABLE KEYS */;
INSERT INTO `templates` VALUES (2,6,1,'Litepac - 1101 - First Test','{\"columns\": [{\"id\": \"ref_6\", \"lsl\": \"2.8\", \"sub\": [], \"usl\": \"\", \"name\": \"Anode\", \"type\": \"number\", \"unit\": \"kV\", \"parentId\": null, \"isReference\": true, \"expectedValue\": \"\", \"validationType\": \"lsl_usl\"}, {\"id\": \"ref_7\", \"lsl\": \"-1.7\", \"sub\": [], \"usl\": \"\", \"name\": \"T2\", \"type\": \"number\", \"unit\": \"kV\", \"parentId\": null, \"isReference\": true, \"expectedValue\": \"\", \"validationType\": \"lsl_usl\"}, {\"id\": \"ref_8\", \"lsl\": \"-1.7\", \"sub\": [], \"usl\": \"\", \"name\": \"T1\", \"type\": \"number\", \"unit\": \"kV\", \"parentId\": null, \"isReference\": true, \"expectedValue\": \"\", \"validationType\": \"lsl_usl\"}, {\"id\": \"ref_9\", \"lsl\": \"-1.7\", \"sub\": [], \"usl\": \"\", \"name\": \"Sparker\", \"type\": \"number\", \"unit\": \"kV\", \"parentId\": null, \"isReference\": true, \"expectedValue\": \"\", \"validationType\": \"lsl_usl\"}, {\"id\": \"ref_10\", \"lsl\": \"\", \"sub\": [], \"usl\": \"\", \"name\": \"Observe Lamp Firing With no Skips\", \"type\": \"passfail\", \"unit\": \"Vin of 250 V\", \"parentId\": null, \"isReference\": true, \"expectedValue\": \"Pass\", \"validationType\": \"pass_fail\"}, {\"id\": \"ref_11\", \"lsl\": \"\", \"sub\": [], \"usl\": \"\", \"name\": \"Observe Lamp Firing with No Skips\", \"type\": \"passfail\", \"unit\": \"Vin to 600 V\", \"parentId\": null, \"isReference\": true, \"expectedValue\": \"Pass\", \"validationType\": \"pass_fail\"}, {\"id\": \"col_1\", \"lsl\": \"2.8\", \"sub\": [], \"usl\": \"\", \"name\": \"Anode\", \"unit\": \"kV\", \"isSplit\": false, \"parentId\": null, \"expectedValue\": \"Pass\", \"validationType\": \"lsl_usl\"}, {\"id\": \"col_2\", \"lsl\": \"-1.7\", \"sub\": [], \"usl\": \"\", \"name\": \"T2\", \"unit\": \"kV\", \"isSplit\": false, \"parentId\": null, \"expectedValue\": \"Pass\", \"validationType\": \"lsl_usl\"}, {\"id\": \"col_3\", \"lsl\": \"-1.7\", \"sub\": [], \"usl\": \"\", \"name\": \"T1\", \"unit\": \"kV\", \"isSplit\": false, \"parentId\": null, \"expectedValue\": \"Pass\", \"validationType\": \"lsl_usl\"}, {\"id\": \"col_4\", \"lsl\": \"-1.7\", \"sub\": [], \"usl\": \"\", \"name\": \"Sparker\", \"unit\": \"kV\", \"isSplit\": false, \"parentId\": null, \"expectedValue\": \"Pass\", \"validationType\": \"lsl_usl\"}, {\"id\": \"col_5\", \"lsl\": \"\", \"sub\": [], \"usl\": \"\", \"name\": \"Observe Lamp Firing with No Skips Vin of 250 V\", \"unit\": \"\", \"isSplit\": false, \"parentId\": null, \"expectedValue\": \"Pass\", \"validationType\": \"pass_fail\"}, {\"id\": \"col_6\", \"lsl\": \"\", \"sub\": [], \"usl\": \"\", \"name\": \"Observe Lamp Firing with No Skips Vin of 600 V\", \"unit\": \"\", \"isSplit\": false, \"parentId\": null, \"expectedValue\": \"Pass\", \"validationType\": \"pass_fail\"}]}',1,NULL,'2025-11-18 02:45:54','2025-11-24 09:08:52'),(4,6,2,'Litepac - 1101 - Final Test','{\"columns\": [{\"id\": \"ref_12\", \"lsl\": \"3\", \"sub\": [], \"usl\": \"\", \"name\": \"Anode\", \"type\": \"number\", \"unit\": \"kV\", \"parentId\": null, \"isReference\": true, \"expectedValue\": \"\", \"validationType\": \"lsl_usl\"}, {\"id\": \"ref_13\", \"lsl\": \"-2\", \"sub\": [], \"usl\": \"\", \"name\": \"T2\", \"type\": \"number\", \"unit\": \"kV\", \"parentId\": null, \"isReference\": true, \"expectedValue\": \"\", \"validationType\": \"lsl_usl\"}, {\"id\": \"ref_14\", \"lsl\": \"-2\", \"sub\": [], \"usl\": \"\", \"name\": \"T1\", \"type\": \"number\", \"unit\": \"kV\", \"parentId\": null, \"isReference\": true, \"expectedValue\": \"\", \"validationType\": \"lsl_usl\"}, {\"id\": \"ref_15\", \"lsl\": \"-2\", \"sub\": [], \"usl\": \"\", \"name\": \"Sparker\", \"type\": \"number\", \"unit\": \"kV\", \"parentId\": null, \"isReference\": true, \"expectedValue\": \"\", \"validationType\": \"lsl_usl\"}, {\"id\": \"ref_16\", \"lsl\": \"\", \"sub\": [], \"usl\": \"\", \"name\": \"Observe Lamp Firing with No Skips\", \"type\": \"passfail\", \"unit\": \"Vin of 250 V\", \"parentId\": null, \"isReference\": true, \"expectedValue\": \"Pass\", \"validationType\": \"pass_fail\"}, {\"id\": \"ref_17\", \"lsl\": \"\", \"sub\": [], \"usl\": \"\", \"name\": \"Observe Lamp Firing with No Skips Vin to 1000 V\", \"type\": \"passfail\", \"unit\": \"Actual 745 V\", \"parentId\": null, \"isReference\": true, \"expectedValue\": \"Pass\", \"validationType\": \"pass_fail\"}, {\"id\": \"col_1\", \"lsl\": \"\", \"sub\": [{\"id\": \"col_2\", \"lsl\": \"3\", \"sub\": [], \"usl\": \"4\", \"name\": \"fr\", \"unit\": \"fr\", \"isSplit\": false, \"parentId\": \"col_1\", \"expectedValue\": \"Pass\", \"validationType\": \"lsl_usl\"}, {\"id\": \"col_3\", \"lsl\": \"3\", \"sub\": [], \"usl\": \"4\", \"name\": \"frfr\", \"unit\": \"frfr\", \"isSplit\": false, \"parentId\": \"col_1\", \"expectedValue\": \"Pass\", \"validationType\": \"lsl_usl\"}, {\"id\": \"col_4\", \"lsl\": \"3\", \"sub\": [], \"usl\": \"4\", \"name\": \"frfrfr\", \"unit\": \"fr\", \"isSplit\": false, \"parentId\": \"col_1\", \"expectedValue\": \"Pass\", \"validationType\": \"lsl_usl\"}], \"usl\": \"\", \"name\": \"we\", \"unit\": \"\", \"isSplit\": true, \"parentId\": null, \"expectedValue\": \"Pass\", \"validationType\": null}]}',1,NULL,'2025-11-18 03:00:05','2025-11-24 09:08:52'),(5,7,1,'Test - 0000 (0000) - First Test','{\"columns\": [{\"id\": \"ref_18\", \"lsl\": \"\", \"sub\": [], \"usl\": \"\", \"name\": \"Test\", \"type\": \"number\", \"unit\": \"Test\", \"parentId\": null, \"isReference\": true, \"expectedValue\": \"\", \"validationType\": \"reference\"}, {\"id\": \"col_1\", \"lsl\": \"\", \"sub\": [{\"id\": \"col_2\", \"lsl\": \"3\", \"sub\": [], \"usl\": \"\", \"name\": \"col1\", \"unit\": \"V\", \"isSplit\": false, \"parentId\": \"col_1\", \"expectedValue\": \"Pass\", \"validationType\": \"lsl_usl\"}, {\"id\": \"col_3\", \"lsl\": \"\", \"sub\": [], \"usl\": \"\", \"name\": \"col2\", \"unit\": \"\", \"isSplit\": false, \"parentId\": \"col_1\", \"expectedValue\": \"Pass\", \"validationType\": \"pass_fail\"}], \"usl\": \"\", \"name\": \"Test1\", \"unit\": \"\", \"isSplit\": true, \"parentId\": null, \"expectedValue\": \"Pass\", \"validationType\": null}, {\"id\": \"col_7\", \"lsl\": \"2\", \"sub\": [{\"id\": \"col_9\", \"lsl\": \"2\", \"sub\": [], \"usl\": \"\", \"name\": \"re\", \"unit\": \"v\", \"isSplit\": false, \"parentId\": \"col_7\", \"expectedValue\": \"Pass\", \"validationType\": \"lsl_usl\"}, {\"id\": \"col_10\", \"lsl\": \"3\", \"sub\": [], \"usl\": \"\", \"name\": \"vf\", \"unit\": \"er\", \"isSplit\": false, \"parentId\": \"col_7\", \"expectedValue\": \"Pass\", \"validationType\": \"lsl_usl\"}], \"usl\": \"\", \"name\": \"Test2\", \"unit\": \"fr\", \"isSplit\": true, \"parentId\": null, \"expectedValue\": \"Pass\", \"validationType\": null}, {\"id\": \"col_8\", \"lsl\": \"\", \"sub\": [], \"usl\": \"\", \"name\": \"tr\", \"unit\": \"\", \"isSplit\": false, \"parentId\": null, \"expectedValue\": \"Fail\", \"validationType\": \"pass_fail\"}]}',1,NULL,'2025-11-18 06:28:21','2025-11-18 06:28:21'),(8,11,1,'Litepac - 1160 (201) - First Test','{\"columns\": [{\"id\": \"ref_26\", \"lsl\": \"\", \"sub\": [], \"usl\": \"\", \"name\": \"Vin Trigger\", \"type\": \"number\", \"unit\": \"\", \"parentId\": null, \"isReference\": true, \"expectedValue\": \"\", \"validationType\": \"lsl_usl\"}, {\"id\": \"col_1\", \"lsl\": \"3.4\", \"sub\": [], \"usl\": \"\", \"name\": \"Anode\", \"unit\": \"kV\", \"isSplit\": false, \"parentId\": null, \"expectedValue\": \"Pass\", \"validationType\": \"lsl_usl\"}]}',1,NULL,'2025-11-28 01:30:32','2025-11-28 01:30:32'),(9,12,1,'Sub-system - ( 502-6517-30 ) - First Test','{\"columns\": [{\"id\": \"ref_28\", \"lsl\": \"\", \"sub\": [], \"usl\": \"\", \"name\": \"test\", \"type\": \"number\", \"unit\": \"\", \"parentId\": null, \"isReference\": true, \"expectedValue\": \"\", \"validationType\": \"lsl_usl\"}, {\"id\": \"ref_29\", \"lsl\": \"\", \"sub\": [], \"usl\": \"\", \"name\": \"test2\", \"type\": \"number\", \"unit\": \"\", \"parentId\": null, \"isReference\": true, \"expectedValue\": \"\", \"validationType\": \"lsl_usl\"}, {\"id\": \"ref_30\", \"lsl\": \"\", \"sub\": [], \"usl\": \"\", \"name\": \"test3\", \"type\": \"number\", \"unit\": \"\", \"parentId\": null, \"isReference\": true, \"expectedValue\": \"\", \"validationType\": \"lsl_usl\"}, {\"id\": \"col_1\", \"lsl\": \"\", \"sub\": [{\"id\": \"col_3\", \"lsl\": \"\", \"sub\": [], \"usl\": \"50\", \"name\": \"Input Current 11V\", \"unit\": \"mA\", \"isSplit\": false, \"parentId\": \"col_1\", \"expectedValue\": \"Pass\", \"validationType\": \"lsl_usl\"}, {\"id\": \"col_4\", \"lsl\": \"154\", \"sub\": [], \"usl\": \"174\", \"name\": \"T2\", \"unit\": \"VDC\", \"isSplit\": false, \"parentId\": \"col_1\", \"expectedValue\": \"Pass\", \"validationType\": \"lsl_usl\"}, {\"id\": \"col_5\", \"lsl\": \"392\", \"sub\": [], \"usl\": \"408\", \"name\": \"Output Vref 3.15V\", \"unit\": \"VDC\", \"isSplit\": false, \"parentId\": \"col_1\", \"expectedValue\": \"Pass\", \"validationType\": \"lsl_usl\"}, {\"id\": \"col_6\", \"lsl\": \"588\", \"sub\": [], \"usl\": \"612\", \"name\": \"Output Vref 4.75V\", \"unit\": \"VDC\", \"isSplit\": false, \"parentId\": \"col_1\", \"expectedValue\": \"Pass\", \"validationType\": \"lsl_usl\"}, {\"id\": \"col_7\", \"lsl\": \"170\", \"sub\": [], \"usl\": \"250\", \"name\": \"Hold Off Time\", \"unit\": \"μSec\", \"isSplit\": false, \"parentId\": \"col_1\", \"expectedValue\": \"Pass\", \"validationType\": \"lsl_usl\"}, {\"id\": \"col_8\", \"lsl\": \"4.0\", \"sub\": [], \"usl\": \"5.0\", \"name\": \"Charge Time\", \"unit\": \"mSec\", \"isSplit\": false, \"parentId\": \"col_1\", \"expectedValue\": \"Pass\", \"validationType\": \"lsl_usl\"}], \"usl\": \"\", \"name\": \"External Vref\", \"unit\": \"\", \"isSplit\": true, \"parentId\": null, \"expectedValue\": \"Pass\", \"validationType\": null}, {\"id\": \"col_2\", \"lsl\": \"\", \"sub\": [{\"id\": \"col_9\", \"lsl\": \"380\", \"sub\": [], \"usl\": \"610\", \"name\": \"INT Vref Range\", \"unit\": \"VDC\", \"isSplit\": false, \"parentId\": \"col_2\", \"expectedValue\": \"Pass\", \"validationType\": \"lsl_usl\"}, {\"id\": \"col_10\", \"lsl\": \"\", \"sub\": [], \"usl\": \"600\", \"name\": \"Set INT Voltage\", \"unit\": \"VDC\", \"isSplit\": false, \"parentId\": \"col_2\", \"expectedValue\": \"Pass\", \"validationType\": \"lsl_usl\"}, {\"id\": \"col_11\", \"lsl\": \"\", \"sub\": [], \"usl\": \"50\", \"name\": \"Input Current\", \"unit\": \"mA\", \"isSplit\": false, \"parentId\": \"col_2\", \"expectedValue\": \"Pass\", \"validationType\": \"lsl_usl\"}, {\"id\": \"col_12\", \"lsl\": \"12.0\", \"sub\": [], \"usl\": \"13.0\", \"name\": \"TP 1\", \"unit\": \"VDC\", \"isSplit\": false, \"parentId\": \"col_2\", \"expectedValue\": \"Pass\", \"validationType\": \"lsl_usl\"}, {\"id\": \"col_13\", \"lsl\": \"1.0\", \"sub\": [], \"usl\": \"2.0\", \"name\": \"Charge Time\", \"unit\": \"mSec\", \"isSplit\": false, \"parentId\": \"col_2\", \"expectedValue\": \"Pass\", \"validationType\": \"lsl_usl\"}], \"usl\": \"\", \"name\": \"Internal Vref\", \"unit\": \"\", \"isSplit\": true, \"parentId\": null, \"expectedValue\": \"Pass\", \"validationType\": null}]}',1,NULL,'2025-12-01 08:48:16','2025-12-01 08:48:16');
/*!40000 ALTER TABLE `templates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `test_entries`
--

DROP TABLE IF EXISTS `test_entries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `test_entries` (
  `id` int NOT NULL AUTO_INCREMENT,
  `template_id` int NOT NULL,
  `product_id` int NOT NULL,
  `test_type_id` int NOT NULL,
  `operator_id` int NOT NULL,
  `test_date` date NOT NULL,
  `po_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `lot_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `multimeter_sn` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `oscilloscope_sn` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `original_serial_number` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_serial_number` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_retest` tinyint(1) DEFAULT '0',
  `retest_iteration` int DEFAULT '0',
  `test_results` json NOT NULL,
  `status` enum('Pass','Fail') COLLATE utf8mb4_unicode_ci NOT NULL,
  `keterangan` text COLLATE utf8mb4_unicode_ci,
  `previous_test_id` int DEFAULT NULL,
  `can_proceed_to_next` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `template_id` (`template_id`),
  KEY `product_id` (`product_id`),
  KEY `test_type_id` (`test_type_id`),
  KEY `operator_id` (`operator_id`),
  KEY `previous_test_id` (`previous_test_id`),
  KEY `idx_serial` (`original_serial_number`),
  KEY `idx_po` (`po_number`),
  KEY `idx_date` (`test_date`),
  KEY `idx_retest` (`original_serial_number`,`test_type_id`,`retest_iteration`),
  CONSTRAINT `test_entries_ibfk_1` FOREIGN KEY (`template_id`) REFERENCES `templates` (`id`),
  CONSTRAINT `test_entries_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `test_entries_ibfk_3` FOREIGN KEY (`test_type_id`) REFERENCES `test_types` (`id`),
  CONSTRAINT `test_entries_ibfk_4` FOREIGN KEY (`operator_id`) REFERENCES `users` (`id`),
  CONSTRAINT `test_entries_ibfk_5` FOREIGN KEY (`previous_test_id`) REFERENCES `test_entries` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `test_entries`
--

LOCK TABLES `test_entries` WRITE;
/*!40000 ALTER TABLE `test_entries` DISABLE KEYS */;
INSERT INTO `test_entries` VALUES (1,2,6,1,4,'2025-11-20','123',NULL,NULL,NULL,'123','123',0,0,'{\"0\": {\"lsl\": \"2.8\", \"usl\": \"\", \"value\": \"4\", \"expected\": \"\", \"validation\": \"lsl_usl\"}, \"1\": {\"lsl\": \"-1.7\", \"usl\": \"\", \"value\": \"4\", \"expected\": \"\", \"validation\": \"lsl_usl\"}, \"2\": {\"lsl\": \"-1.7\", \"usl\": \"\", \"value\": \"4\", \"expected\": \"\", \"validation\": \"lsl_usl\"}, \"3\": {\"lsl\": \"-1.7\", \"usl\": \"\", \"value\": \"4\", \"expected\": \"\", \"validation\": \"lsl_usl\"}, \"4\": {\"lsl\": \"\", \"usl\": \"\", \"value\": \"Pass\", \"expected\": \"Pass\", \"validation\": \"pass_fail\"}, \"5\": {\"lsl\": \"\", \"usl\": \"\", \"value\": \"Pass\", \"expected\": \"Pass\", \"validation\": \"pass_fail\"}}','Pass',NULL,NULL,1,'2025-11-19 19:41:44'),(2,2,6,1,5,'2025-11-20','123123',NULL,NULL,NULL,'123','123',0,0,'{\"0\": {\"lsl\": \"2.8\", \"usl\": \"\", \"value\": \"678\", \"expected\": \"\", \"validation\": \"lsl_usl\"}, \"1\": {\"lsl\": \"-1.7\", \"usl\": \"\", \"value\": \"5\", \"expected\": \"\", \"validation\": \"lsl_usl\"}, \"2\": {\"lsl\": \"-1.7\", \"usl\": \"\", \"value\": \"7\", \"expected\": \"\", \"validation\": \"lsl_usl\"}, \"3\": {\"lsl\": \"-1.7\", \"usl\": \"\", \"value\": \"676\", \"expected\": \"\", \"validation\": \"lsl_usl\"}, \"4\": {\"lsl\": \"\", \"usl\": \"\", \"value\": \"Pass\", \"expected\": \"Pass\", \"validation\": \"pass_fail\"}, \"5\": {\"lsl\": \"\", \"usl\": \"\", \"value\": \"Pass\", \"expected\": \"Pass\", \"validation\": \"pass_fail\"}}','Pass',NULL,NULL,1,'2025-11-19 19:49:08'),(4,8,11,1,9,'2025-11-28','123456',NULL,NULL,NULL,'25501234','25501234',0,0,'{\"0\": {\"lsl\": \"3.4\", \"usl\": \"\", \"value\": \"4\", \"expected\": \"\", \"validation\": \"lsl_usl\"}}','Pass',NULL,NULL,1,'2025-11-28 01:42:34'),(5,8,11,1,10,'2025-12-01','12312',NULL,NULL,NULL,'313123','313123',0,0,'{\"0\": {\"lsl\": \"3.4\", \"usl\": \"\", \"value\": \"4\", \"expected\": \"\", \"validation\": \"lsl_usl\"}}','Pass',NULL,NULL,1,'2025-12-01 04:48:42'),(6,8,11,1,11,'2025-12-01','123123',NULL,NULL,NULL,'12312312','12312312',0,0,'{\"0\": {\"lsl\": \"3.4\", \"usl\": \"\", \"value\": \"2\", \"expected\": \"\", \"validation\": \"lsl_usl\"}}','Fail',NULL,NULL,0,'2025-12-01 04:52:44'),(7,8,11,1,9,'2025-12-05','123456',NULL,NULL,NULL,'123123123','123123123',0,0,'{\"0\": {\"lsl\": \"3.4\", \"usl\": \"\", \"value\": \"4\", \"expected\": \"\", \"validation\": \"lsl_usl\"}}','Pass',NULL,NULL,1,'2025-12-05 08:31:30'),(8,8,11,1,9,'2025-12-05','1231',NULL,NULL,NULL,'123123131','123123131',0,0,'{\"0\": {\"lsl\": \"3.4\", \"usl\": \"\", \"value\": \"4\", \"expected\": \"\", \"validation\": \"lsl_usl\"}}','Pass',NULL,NULL,1,'2025-12-05 08:42:40'),(9,8,11,1,9,'2025-12-05','1231231','2','1231123','123123','123123456','123123456',0,0,'{\"0\": {\"lsl\": \"3.4\", \"usl\": \"\", \"value\": \"4\", \"expected\": \"\", \"validation\": \"lsl_usl\"}}','Pass',NULL,NULL,1,'2025-12-05 08:56:43'),(10,8,11,1,9,'2025-12-05','1231231','2','1231','123','123123','123123',0,0,'{\"0\": {\"lsl\": \"3.4\", \"usl\": \"\", \"value\": \"4\", \"expected\": \"\", \"validation\": \"lsl_usl\"}}','Pass',NULL,NULL,1,'2025-12-05 09:27:27');
/*!40000 ALTER TABLE `test_entries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `test_types`
--

DROP TABLE IF EXISTS `test_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `test_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_custom` tinyint(1) DEFAULT '0',
  `sequence_order` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `test_types`
--

LOCK TABLES `test_types` WRITE;
/*!40000 ALTER TABLE `test_types` DISABLE KEYS */;
INSERT INTO `test_types` VALUES (1,'First Test',0,1,'2025-11-01 17:53:33'),(2,'Final Test',0,2,'2025-11-01 17:53:33');
/*!40000 ALTER TABLE `test_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('admin','operator') COLLATE utf8mb4_unicode_ci DEFAULT 'operator',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','admin123','Administrator','admin',1,'2025-11-01 17:53:33'),(2,'operator1','operator123','Operator Satu','operator',1,'2025-11-01 17:53:33'),(3,'QW','temp123','QW','operator',1,'2025-11-07 08:21:01'),(4,'we','temp123','we','operator',1,'2025-11-19 19:41:44'),(5,'rt','temp123','rt','operator',1,'2025-11-19 19:49:08'),(8,'qe','temp123','qe','operator',1,'2025-11-24 02:59:26'),(9,'Haziq','temp123','Haziq','operator',1,'2025-11-28 01:42:34'),(10,'123','temp123','123','operator',1,'2025-12-01 04:48:42'),(11,'qwe','temp123','qwe','operator',1,'2025-12-01 04:52:44');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `v_product_details`
--

DROP TABLE IF EXISTS `v_product_details`;
/*!50001 DROP VIEW IF EXISTS `v_product_details`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_product_details` AS SELECT 
 1 AS `id`,
 1 AS `product_name`,
 1 AS `series_number`,
 1 AS `series`,
 1 AS `is_active`,
 1 AS `created_at`,
 1 AS `test_sequence`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_templates_detail`
--

DROP TABLE IF EXISTS `v_templates_detail`;
/*!50001 DROP VIEW IF EXISTS `v_templates_detail`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_templates_detail` AS SELECT 
 1 AS `id`,
 1 AS `template_name`,
 1 AS `product_name`,
 1 AS `series_number`,
 1 AS `series`,
 1 AS `test_type_name`,
 1 AS `sequence_order`,
 1 AS `custom_columns`,
 1 AS `is_active`,
 1 AS `created_by_name`,
 1 AS `created_at`,
 1 AS `updated_at`*/;
SET character_set_client = @saved_cs_client;

--
-- Final view structure for view `v_product_details`
--

/*!50001 DROP VIEW IF EXISTS `v_product_details`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_product_details` AS select `p`.`id` AS `id`,`p`.`product_name` AS `product_name`,`p`.`series_number` AS `series_number`,`p`.`series` AS `series`,`p`.`is_active` AS `is_active`,`p`.`created_at` AS `created_at`,group_concat(concat(`tt`.`name`,':',`pts`.`sequence_order`) order by `pts`.`sequence_order` ASC separator '|') AS `test_sequence` from ((`products` `p` left join `product_test_sequence` `pts` on((`p`.`id` = `pts`.`product_id`))) left join `test_types` `tt` on((`pts`.`test_type_id` = `tt`.`id`))) where (`p`.`is_active` = 1) group by `p`.`id`,`p`.`product_name`,`p`.`series_number`,`p`.`series`,`p`.`is_active`,`p`.`created_at` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_templates_detail`
--

/*!50001 DROP VIEW IF EXISTS `v_templates_detail`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_templates_detail` AS select `t`.`id` AS `id`,`t`.`template_name` AS `template_name`,`p`.`product_name` AS `product_name`,`p`.`series_number` AS `series_number`,`p`.`series` AS `series`,`tt`.`name` AS `test_type_name`,`tt`.`sequence_order` AS `sequence_order`,`t`.`custom_columns` AS `custom_columns`,`t`.`is_active` AS `is_active`,`u`.`full_name` AS `created_by_name`,`t`.`created_at` AS `created_at`,`t`.`updated_at` AS `updated_at` from (((`templates` `t` join `products` `p` on((`t`.`product_id` = `p`.`id`))) join `test_types` `tt` on((`t`.`test_type_id` = `tt`.`id`))) left join `users` `u` on((`t`.`created_by` = `u`.`id`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-09  9:58:35
