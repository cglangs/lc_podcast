DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `get_report`()
BEGIN

SELECT COUNT(*) AS character_count, hsk_t.min_hsk_level FROM 
(
SELECT DISTINCT imported_characters.characters as chars, MIN(hsk4.hsk_level) as min_hsk_level
FROM 
imported_characters 
LEFT JOIN hsk4 
ON hsk4.characters LIKE CONCAT('%', imported_characters.characters, '%') 
GROUP BY imported_characters.characters
) as hsk_t
GROUP BY min_hsk_level;

END$$
DELIMITER ;
