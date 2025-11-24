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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_test_parameters`
--

LOCK TABLES `product_test_parameters` WRITE;
/*!40000 ALTER TABLE `product_test_parameters` DISABLE KEYS */;
INSERT INTO `product_test_parameters` VALUES (1,1,1,'kV',NULL,'kV','3','4','lsl_usl',1,'2025-11-14 08:09:26');
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_test_sequence`
--

LOCK TABLES `product_test_sequence` WRITE;
/*!40000 ALTER TABLE `product_test_sequence` DISABLE KEYS */;
INSERT INTO `product_test_sequence` VALUES (1,1,1,1,1,'2025-11-14 08:09:26');
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,'Litepack','1101','201-Series',1,'2025-11-14 08:09:26');
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `templates`
--

LOCK TABLES `templates` WRITE;
/*!40000 ALTER TABLE `templates` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `test_entries`
--

LOCK TABLES `test_entries` WRITE;
/*!40000 ALTER TABLE `test_entries` DISABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `test_types`
--

LOCK TABLES `test_types` WRITE;
/*!40000 ALTER TABLE `test_types` DISABLE KEYS */;
INSERT INTO `test_types` VALUES (1,'First Test',0,1,'2025-11-01 17:53:33'),(2,'Final Test',0,2,'2025-11-01 17:53:33'),(3,'Spectrometer Test',0,3,'2025-11-01 17:53:33'),(4,'wdaaw',1,4,'2025-11-01 20:33:26');
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','admin123','Administrator','admin',1,'2025-11-01 17:53:33'),(2,'operator1','operator123','Operator Satu','operator',1,'2025-11-01 17:53:33'),(3,'QW','temp123','QW','operator',1,'2025-11-07 08:21:01');
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

-- Dump completed on 2025-11-16  9:34:14
