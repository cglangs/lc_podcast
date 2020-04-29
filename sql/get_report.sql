DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `get_report`()
BEGIN

DECLARE totalDistinctChars INT;

SELECT COUNT(DISTINCT imported_characters.characters) 
FROM imported_characters
INTO totalDistinctChars;



SELECT COUNT(*) AS character_count, COUNT(*)/totalDistinctChars AS percentage, hsk_t.min_hsk_level FROM 
(
SELECT DISTINCT imported_characters.characters as chars, COALESCE(MIN(hsk4.hsk_level),special_chars.char_text) as min_hsk_level
FROM 
imported_characters 
LEFT JOIN hsk4 
ON hsk4.characters LIKE CONCAT('%', imported_characters.characters, '%')
LEFT JOIN special_chars
ON special_chars.char_text = imported_characters.characters
GROUP BY imported_characters.characters
) as hsk_t
GROUP BY min_hsk_level;

END$$
DELIMITER ;
