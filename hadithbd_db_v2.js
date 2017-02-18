var mysql      = require('mysql');
var sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const chalk = require('chalk');

console.log('Initiated');

//var book_info = new sqlite3.Database('output/book_info.tar');
var striptags = require('striptags');
var Entities = require('html-entities').XmlEntities;
entities = new Entities();

var MySqlConn = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'hadithbd'
});

MySqlConn.connect();

/*var cl_arguments = process.argv.slice(2);

console.log('Argument Received '+cl_arguments[0]);

switch (cl_arguments[0]) {
    case '--gen_books':
        console.log('Canvas');
        generateBooksTable();
        break;
    case '--gen_book_categories':
        text = "Today is Sunday";
        break;
    case '--help':
    case '-h':
    default:
        showHelp();
}*/

/*generateBooksTable(function()
{
    generateBooksCategoryTable(function()
    {
        book_info.close();
        MySqlConn.end();
    })
});*/

/*singleBookDb_hb_section(1, function(book_id, hb_book)
{
    singleBookDb_hb_chapter(book_id, hb_book, function (book_id, hb_book)
    {
        singleBookDb_hb_explanation(book_id, hb_book, function (id, hb_book)
        {
            singleBookDb_hb_content(book_id, hb_book, function (id, hb_book)
            {

                hb_book.close();
                MySqlConn.end();

            })
        })
    });
})*/

singleBookDb_hb_content(1, function(book_id, hb_book)
{
    hb_book.close();
    MySqlConn.end();
})

function singleBookDb_hb_section(id, cb)
{
    var hb_book = new sqlite3.Database('output/hb_'+id+'.tar');

    hb_book.serialize(function()
    {
        hb_book.run('CREATE TABLE IF NOT EXISTS "android_metadata" ("locale" TEXT);INSERT INTO android_metadata VALUES("en_US");');
        hb_book.run('INSERT INTO android_metadata VALUES("en_US");');

        hb_book.run('DROP TABLE IF EXISTS `section`;');
        hb_book.run('CREATE TABLE section ("id" INTEGER, "serial" INTEGER, "nameEnglish" VARCHAR,"nameBengali" VARCHAR, "hadith_number" INTEGER, "range_start" INTEGER, "range_end" INTEGER, PRIMARY KEY("id"));');

        hb_book.run('DROP TABLE IF EXISTS `chapter`;');
        hb_book.run('CREATE TABLE "chapter" ("id" INTEGER, "nameEnglish" VARCHAR,"nameBengali" VARCHAR, "nameArabic" VARCHAR, "sectionId" INTEGER,"hadith_number" INTEGER, PRIMARY KEY("id"));');

        hb_book.run('DROP TABLE IF EXISTS `explanation`;');
        hb_book.run('CREATE TABLE "explanation" ("id" INTEGER, "hadithId" INTEGER, "explanation" TEXT, PRIMARY KEY("id"));');

        hb_book.run('DROP TABLE IF EXISTS `content`;');
        hb_book.run('CREATE TABLE `content` ("id" INTEGER, "sequence" INTEGER, "statusId" INTEGER, "if_cross_checked" INTEGER, "chapterId" INTEGER, "sectionId" INTEGER, "hadithNo" INTEGER, PRIMARY KEY("id"));');


        hb_book.run('DROP TABLE IF EXISTS `content_fts`;');
        hb_book.run('CREATE VIRTUAL TABLE "content_fts" USING fts4 ("hadithBengali" TEXT,"hadithEnglish" TEXT,"hadithArabic" TEXT,"note" TEXT,"rabiNameBangla" TEXT,"rabiNameEnglish" TEXT,"publisherNameEnglish" TEXT,"publisherNameBangla" TEXT,"status_bn" TEXT,"status_en" TEXT);');


        MySqlConn.query("SELECT hadithsection.SectionID AS id, hadithsection.serial, hadithsection.SectionBD AS nameBengali, hadithsection.SectionEN AS nameEnglish, ( SELECT COUNT(*) FROM hadithmain WHERE hadithmain.SectionID = hadithsection.SectionID ) AS hadith_number, ( SELECT min(hadithmain.HadithNo) FROM hadithmain WHERE hadithmain.SectionID = hadithsection.SectionID AND hadithmain.BookID = "+id+" ) AS range_start, ( SELECT max(hadithmain.HadithNo) FROM hadithmain WHERE hadithmain.SectionID = hadithsection.SectionID AND hadithmain.BookID = "+id+" ) AS range_end FROM hadithsection WHERE hadithsection.BookID = "+id+" AND hadithsection.SecActive = 1", function(err, rows, fields1) {
            if (err) throw err;

            var io = 1;

            if(rows.length==0)
            {
                console.log("No Section Under This ID")
                cb(id, hb_book);
            }

            rows.forEach(function(row){

                hb_book.run("INSERT INTO section ('id', 'serial', 'nameEnglish', 'nameBengali', 'hadith_number', 'range_start', 'range_end') VALUES ("+row.id+", "+row.serial+", '"+striptags(entities.encode(row.nameEnglish+""))+"', '"+striptags(entities.encode(row.nameBengali+""))+"', "+row.hadith_number+", "+row.range_start+", "+row.range_end+");");

                console.log(io+" < section table for  > "+rows.length)

                if(io == rows.length)
                {
                    cb(id, hb_book);
                }
                io = io + 1;
            })
        });
    })
}

function singleBookDb_hb_chapter(id, cb)
{
    var hb_book = new sqlite3.Database('output/hb_'+id+'.tar');

    hb_book.serialize(function() {

        MySqlConn.query("SELECT hadithchapter.chapID AS id, IFNULL(hadithchapter.ChapterBG, "+'"'+""+'"'+") AS nameBengali, IFNULL(hadithchapter.ChapterEN, "+'"'+""+'"'+") AS nameEnglish, IFNULL(hadithchapter.ChapterAR, "+'"'+""+'"'+") AS nameArabic, IFNULL(hadithchapter.SectionID, "+'"'+""+'"'+") AS sectionId, ( SELECT COUNT(*) FROM hadithmain WHERE hadithmain.chapterID = hadithchapter.chapID ) AS hadith_number FROM hadithchapter WHERE hadithchapter.StatusActive = 1 AND hadithchapter.BookID = "+id, function(err, rows, fields1) {
            if (err) throw err;

            var io = 1;

            if(rows.length==0)
            {
                console.log("No Chapter Under This ID")
                cb(id, hb_book);
            }

            rows.forEach(function(row){

                hb_book.run("INSERT INTO chapter ('id', 'nameEnglish', 'nameBengali', 'nameArabic', 'sectionId', 'hadith_number') VALUES ("+row.id+", '"+striptags(entities.encode(row.nameEnglish))+"', '"+striptags(entities.encode(row.nameBengali+""))+"', '"+striptags(entities.encode(row.nameArabic+""))+"', "+row.sectionId+", "+row.hadith_number+");");

                console.log(io+" < chapter table for  > "+rows.length)

                if(io == rows.length)
                {
                    cb(id, hb_book);
                }
                io = io + 1;
            })
        });

    });
}


function singleBookDb_hb_explanation(id, cb)
{
    var hb_book = new sqlite3.Database('output/hb_'+id+'.tar');

    hb_book.serialize(function()
    {

        MySqlConn.query("SELECT hadithexplanation.expID AS id, hadithexplanation.hadithID AS hadithId, hadithexplanation.explanation AS explanation FROM `hadithexplanation` WHERE hadithexplanation.active = 1 AND FIND_IN_SET( hadithexplanation.hadithID, ( SELECT GROUP_CONCAT( hadithmain.HadithID SEPARATOR ',' ) AS hadithIDList FROM hadithmain WHERE hadithmain.BookID = "+id+" ))", function(err, rows, fields1) {
            if (err) throw err;

            var io = 1;

            if(rows.length==0)
            {
                console.log("No explanation Under This ID")
                cb(id, hb_book);
            }

            rows.forEach(function(row){

                hb_book.run("INSERT INTO explanation (id,hadithId,explanation) VALUES ("+row.id+","+row.hadithId+",'"+striptags(entities.encode(row.explanation+""))+"')");

                console.log(io+" < explanation table for  > "+rows.length)

                if(io == rows.length)
                {
                    cb(id, hb_book);
                }
                io = io + 1;
            })
        });

    });
}

function singleBookDb_hb_content(id, cb)
{
    var hb_book = new sqlite3.Database('output/hb_'+id+'.tar');

    hb_book.serialize(function()
    {

        MySqlConn.query("SELECT hadithmain.HadithID AS id, (@cnt := @cnt + 1) AS sequence, hadithmain.HadithStatus AS statusId, hadithmain.CheckStatus AS if_cross_checked, hadithmain.chapterID AS chapterId, hadithmain.SectionID AS sectionId, hadithmain.HadithNo AS hadithNo, hadithmain.BanglaHadith AS hadithBengali, hadithmain.EnglishHadith AS hadithEnglish, hadithmain.ArabicHadith AS hadithArabic, hadithmain.HadithNote AS note, ( SELECT rabihadith.rabiBangla FROM rabihadith WHERE rabihadith.rabiID = hadithmain.RabiID ) AS rabiNameBangla, ( SELECT rabihadith.rabiEnglish FROM rabihadith WHERE rabihadith.rabiID = hadithmain.RabiID ) AS rabiNameEnglish, ( SELECT hadithsource.SourceNameEN FROM hadithsource WHERE hadithsource.SourceID = hadithmain.SourceID ) AS publisherNameEnglish, ( SELECT hadithsource.SourceNameBD FROM hadithsource WHERE hadithsource.SourceID = hadithmain.SourceID ) AS publisherNameBangla, ( SELECT hadithstatus.StatusBG FROM hadithstatus WHERE hadithstatus.StatusID = hadithmain.HadithStatus ) AS status_bn, ( SELECT hadithstatus.StatusEN FROM hadithstatus WHERE hadithstatus.StatusID = hadithmain.HadithStatus ) AS status_en FROM `hadithmain` CROSS JOIN (SELECT @cnt := 0) AS dummy WHERE hadithmain.HadithActive = 1 AND hadithmain.BookID = "+id+" ORDER BY SectionID ASC", function(err, rows, fields1) {
            if (err) throw err;

            var io = 1;

            if(rows.length==0)
            {
                console.log("No contents Under This ID")
                cb(id, hb_book);
            }

            rows.forEach(function(row){

                hb_book.run("INSERT INTO content (id,sequence,statusId,if_cross_checked,chapterId,sectionId,hadithNo) VALUES ("+row.id+","+row.sequence+","+row.statusId+","+row.if_cross_checked+","+row.chapterId+","+row.sectionId+","+row.hadithNo+")");

                hb_book.run("INSERT INTO content_fts (docid, hadithBengali, hadithEnglish, hadithArabic, note, rabiNameBangla, rabiNameEnglish, publisherNameEnglish, publisherNameBangla, status_bn, status_en) VALUES ("+row.id+", '"+striptags(entities.encode(row.hadithBengali+""))+"', '"+striptags(entities.encode(row.hadithEnglish+""))+"', '"+striptags(entities.encode(row.hadithArabic+""))+"', '"+striptags(entities.encode(row.note+""))+"', '"+striptags(entities.encode(row.rabiNameBangla+""))+"', '"+striptags(entities.encode(row.rabiNameEnglish+""))+"', '"+striptags(entities.encode(row.publisherNameEnglish+""))+"', '"+striptags(entities.encode(row.publisherNameBangla+""))+"', '"+striptags(entities.encode(row.status_bn+""))+"', '"+striptags(entities.encode(row.status_en+""))+"')");

                console.log(io+" < contents table for  > "+rows.length)

                if(io == rows.length)
                {
                    cb(id, hb_book);
                }
                io = io + 1;
            })
        });

    });
}


function generateBooksTable(cb)
{
    book_info.serialize(function(){

        book_info.run('CREATE TABLE IF NOT EXISTS "android_metadata" ("locale" TEXT);INSERT INTO android_metadata VALUES("en_US");');

        book_info.run('INSERT INTO android_metadata VALUES("en_US");');

        book_info.run('DROP TABLE IF EXISTS `books`;');

        book_info.run("CREATE TABLE 'books' ( 'id' INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, 'hadithbd_id' INTEGER, 'book_name' TEXT, 'book_type' TEXT, 'book_version' TEXT, 'book_category_id' INTEGER, 'meta_data' TEXT, 'sort_priority' INTEGER, 'download_status' INTEGER );");

        book_info.run('DROP TABLE IF EXISTS ob_categories;');

        book_info.run('CREATE TABLE ob_categories ("id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, "name" TEXT);');

        MySqlConn.query("SELECT hadithbook.BookID AS hadithbd_id, hadithbook.BookNameBD AS book_name, 'hb' AS book_type, '1' AS book_version, '0' AS book_category_id, CONCAT( '{hadithsource_info:{bangla:"+'"'+"', ( HTML_Encode ( IFNULL(( SELECT hadithsource.SourceNameBD FROM hadithsource WHERE hadithsource.SourceID = hadithbook.PubID ), "+'"'+""+'"'+" ))), '"+'"'+", english:"+'"'+"', ( HTML_Encode ( IFNULL(( SELECT hadithsource.SourceNameEN FROM hadithsource WHERE hadithsource.SourceID = hadithbook.PubID ), "+'"'+""+'"'+" ))), '"+'"'+"}', ', no_of_sections:', ( IFNULL(( SELECT COUNT(*) AS total FROM hadithsection WHERE hadithsection.BookID = hadithbook.BookID ), 0 )), ', no_of_hadith:', ( IFNULL(( SELECT COUNT(*) AS total FROM hadithmain WHERE hadithmain.BookID = hadithbook.BookID ), 0 )), '}' ) AS meta_data, hadithbook.priority AS sort_priority, '0' AS download_status FROM hadithbook WHERE hadithbook.Active = 1 UNION ALL SELECT books_name.bookID AS hadithbd_id, books_name.Book_nameBD AS book_name, 'ob' AS book_type, '1' AS book_version, booktype AS book_category_id, CONCAT( '{writer_name:"+'"'+"', HTML_Encode ( IFNULL(( SELECT book_writter.writter_nameBN FROM book_writter WHERE book_writter.wrID = books_name.writterID ), "+'"'+""+'"'+" )), '"+'"'+", no_of_section:', ( HTML_Encode ( IFNULL(( SELECT COUNT(*) FROM book_section WHERE book_section.BookID = books_name.bookID ), "+'"'+""+'"'+" ))), ', no_of_content:', ( HTML_Encode ( IFNULL(( SELECT COUNT(*) FROM books_content WHERE books_content.bookID = books_name.bookID ), "+'"'+""+'"'+" ))), '}' ) AS meta_data, 0 AS sort_priority, '0' AS download_status FROM books_name WHERE books_name.Active = 1", function(err, rows, fields1) {
            if (err) throw err;

            var io = 1;

            rows.forEach(function(row){

                book_info.run("INSERT INTO books (`hadithbd_id`, `book_name`, `book_type`, `book_version`, `book_category_id`, `meta_data`, `sort_priority`, `download_status`) VALUES ('"+row.hadithbd_id+"', '"+row.book_name+"', '"+row.book_type+"', '"+row.book_version+"', '"+row.book_category_id+"', '"+row.meta_data+"', '"+row.sort_priority+"', '"+row.download_status+"')");

                console.log(io+" < books table for  > "+rows.length)

                if(io == rows.length)
                {
                    cb();
                }
                io = io + 1;
            })
        });
    })
}

function generateBooksCategoryTable(cb)
{
    book_info.serialize(function() {

        MySqlConn.query("SELECT books_type.btypeID as id, books_type.bookCat as name FROM books_type", function(err, rows, fields1) {
            if (err) throw err;

            var io = 1;

            rows.forEach(function(row){

                book_info.run("INSERT INTO ob_categories (id, name) VALUES ('"+row.id+"', '"+striptags(entities.encode(row.name+""))+"');");

                console.log(io+" < books_type table for  > "+rows.length)

                if(io == rows.length)
                {
                    cb();
                }
                io = io + 1;
            })
        });

    });
}

/*function showHelp()
{
    console.log(chalk.yellow('BanglaHadith SQL Lite Database Generator Script\n\n'));
    console.log(chalk.white('You have following arguments available\n'));
    console.log(chalk.green('1. ')+chalk.white('--gen_books                   Generate books table for android app\n'));
    console.log(chalk.green('2. ')+chalk.white('--gen_book_categories         Generate book category table for android app\n'));
    MySqlConn.close();
}*/


