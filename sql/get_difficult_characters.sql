DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `get_difficult_characters`()
BEGIN
SELECT DISTINCT imported_characters.characters AS distinct_difficult_characters
FROM 
imported_characters
LEFT JOIN hsk4
ON hsk4.characters LIKE CONCAT('%', imported_characters.characters, '%')
LEFT JOIN proper_nouns 
ON proper_nouns.word LIKE CONCAT('%', imported_characters.characters, '%')
WHERE hsk4.characters IS NULL AND proper_nouns.word IS NULL;
END$$
DELIMITER ;
