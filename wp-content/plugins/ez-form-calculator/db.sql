CREATE TABLE IF NOT EXISTS `__PREFIX__ezfc_debug` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `msg` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS `__PREFIX__ezfc_forms` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT COLLATE="utf8_general_ci";

CREATE TABLE IF NOT EXISTS `__PREFIX__ezfc_forms_elements` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `f_id` int(10) unsigned NOT NULL,
  `e_id` int(10) unsigned NOT NULL,
  `data` text NOT NULL,
  `position` int(10) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `f_id` (`f_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT COLLATE="utf8_general_ci";

CREATE TABLE IF NOT EXISTS `__PREFIX__ezfc_forms_options` (
  `f_id` int(10) unsigned NOT NULL,
  `o_id` int(10) unsigned NOT NULL,
  `value` text NOT NULL,
  PRIMARY KEY (`f_id`,`o_id`)
) ENGINE=InnoDB DEFAULT COLLATE="utf8_general_ci";

CREATE TABLE IF NOT EXISTS `__PREFIX__ezfc_options` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `value` text NOT NULL,
  `description` text NOT NULL,
  `description_long` text NOT NULL,
  `type` text NOT NULL,
  `cat` varchar(20) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT COLLATE="utf8_general_ci";

CREATE TABLE IF NOT EXISTS `__PREFIX__ezfc_submissions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `f_id` int(10) unsigned NOT NULL,
  `data` mediumtext NOT NULL,
  `content` mediumtext NOT NULL,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ip` varchar(50) NOT NULL,
  `ref_id` VARCHAR(16) NOT NULL,
  `total` DOUBLE NOT NULL,
  `payment_id` INT UNSIGNED NOT NULL DEFAULT '0',
  `transaction_id` VARCHAR(50) NOT NULL,
  `token` VARCHAR(20) NOT NULL,
  `user_mail` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `f_id` (`f_id`)
) ENGINE=InnoDB DEFAULT COLLATE="utf8_general_ci";

CREATE TABLE IF NOT EXISTS `__PREFIX__ezfc_templates` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `data` text NOT NULL,
  `options` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT COLLATE="utf8_general_ci";

CREATE TABLE IF NOT EXISTS `__PREFIX__ezfc_files` (
	`id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
	`f_id` INT(10) UNSIGNED NOT NULL,
	`ref_id` VARCHAR(16) NOT NULL,
	`url` VARCHAR(2048) NOT NULL,
	`file` VARCHAR(2048) NOT NULL,
	PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT COLLATE="utf8_general_ci";

CREATE TABLE IF NOT EXISTS `__PREFIX__ezfc_preview` (
  `id` INT(10) NOT NULL AUTO_INCREMENT,
  `f_id` INT(11) NOT NULL,
  `data` MEDIUMTEXT NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `f_id` (`f_id`)
)
COLLATE='latin1_swedish_ci' ENGINE=InnoDB;