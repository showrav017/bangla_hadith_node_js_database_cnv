SELECT
	hadithbook.BookID AS hadithbd_id,
	hadithbook.BookNameBD AS book_name,
	'hb' AS book_type,
	'1' AS book_version,
	'0' AS book_category_id,
	CONCAT(
		'{hadithsource_info:{bangla:"',
		(
			HTML_Encode (
				IFNULL(
					(
						SELECT
							hadithsource.SourceNameBD
						FROM
							hadithsource
						WHERE
							hadithsource.SourceID = hadithbook.PubID
					),
					""
				)
			)
		),
		'", english:"',
		(
			HTML_Encode (
				IFNULL(
					(
						SELECT
							hadithsource.SourceNameEN
						FROM
							hadithsource
						WHERE
							hadithsource.SourceID = hadithbook.PubID
					),
					""
				)
			)
		),
		'"}',
		', no_of_sections:',
		(
			IFNULL(
				(
					SELECT
						COUNT(*) AS total
					FROM
						hadithsection
					WHERE
						hadithsection.BookID = hadithbook.BookID
				),
				0
			)
		),
		', no_of_hadith:',
		(
			IFNULL(
				(
					SELECT
						COUNT(*) AS total
					FROM
						hadithmain
					WHERE
						hadithmain.BookID = hadithbook.BookID
				),
				0
			)
		),
		'}'
	) AS meta_data,
	hadithbook.priority AS sort_priority,
	'0' AS download_status
FROM
	hadithbook
WHERE
	hadithbook.Active = 1
UNION ALL
	SELECT
		books_name.bookID AS hadithbd_id,
		books_name.Book_nameBD AS book_name,
		'ob' AS book_type,
		'1' AS book_version,
		booktype AS book_category_id,
		CONCAT(
			'{writer_name:"',
			HTML_Encode (
				IFNULL(
					(
						SELECT
							book_writter.writter_nameBN
						FROM
							book_writter
						WHERE
							book_writter.wrID = books_name.writterID
					),
					""
				)
			),
			'", no_of_section:',
			(
				HTML_Encode (
					IFNULL(
						(
							SELECT
								COUNT(*)
							FROM
								book_section
							WHERE
								book_section.BookID = books_name.bookID
						),
						""
					)
				)
			),
			', no_of_content:',
			(
				HTML_Encode (
					IFNULL(
						(
							SELECT
								COUNT(*)
							FROM
								books_content
							WHERE
								books_content.bookID = books_name.bookID
						),
						""
					)
				)
			),
			'}'
		) AS meta_data,
		0 AS sort_priority,
		'0' AS download_status
	FROM
		books_name
	WHERE
		books_name.Active = 1
		
		
SELECT
	hadithsection.SectionID AS id,
	hadithsection.serial,
	hadithsection.SectionBD AS nameBengali,
	hadithsection.SectionEN AS nameEnglish,
	(SELECT COUNT(*) FROM hadithmain WHERE hadithmain.SectionID = hadithsection.SectionID) AS hadith_number,
	(SELECT min(hadithmain.HadithNo) FROM hadithmain WHERE hadithmain.SectionID = hadithsection.SectionID AND hadithmain.BookID = 4) AS range_start,
	(SELECT max(hadithmain.HadithNo) FROM hadithmain WHERE hadithmain.SectionID = hadithsection.SectionID AND hadithmain.BookID = 4) AS range_end
FROM
	hadithsection
WHERE
	hadithsection.BookID = 4
AND hadithsection.SecActive = 1 