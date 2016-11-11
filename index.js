var mysql      = require('mysql');
var sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

fs.unlink('hb10.tar', (err) => {
  if (err) throw err;
  console.log('successfully deleted hb10.tar');
});

var db = new sqlite3.Database('hb10.tar');
var striptags = require('striptags');
var Entities = require('html-entities').XmlEntities; 
entities = new Entities();

var MySqlConn = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '123456',
  database : 'bangla_hadith'
});

MySqlConn.connect();

var BookSectionWiseRange = {};


db.serialize(function() {
	
	db.run('CREATE TABLE "android_metadata" ("locale" TEXT);INSERT INTO android_metadata VALUES("en_US");');
	
	db.run('INSERT INTO android_metadata VALUES("en_US");');

    /*
	db.run('CREATE VIRTUAL TABLE "hadithbook"  USING fts4("id" INTEGER,"nameEnglish" VARCHAR,"nameBengali" VARCHAR,"lastUpdate" VARCHAR,"isActive" INTEGER,"priority" INTEGER,"publisherId" INTEGER, "section_number" INTEGER, "hadith_number" INTEGER, PRIMARY KEY("id"));');
	
	db.run('CREATE VIRTUAL TABLE "hadithchapter"  USING fts4("id" INTEGER, "nameEnglish" VARCHAR,"nameBengali" VARCHAR, "nameArabic" VARCHAR, "lastUpdate" VARCHAR,"isActive" INTEGER,"bookId" INTEGER,"sectionId" INTEGER,"hadith_number" INTEGER, PRIMARY KEY( "id"));');
	
	db.run('CREATE VIRTUAL TABLE "hadithsection"  USING fts4("nameEnglish" VARCHAR,"nameBengali" VARCHAR,"lastUpdate" VARCHAR,"isActive" INTEGER,"id" INTEGER,"serial" INTEGER,"bookId" INTEGER, "hadith_number" INTEGER, "range_start" INTEGER, "range_end" INTEGER, PRIMARY KEY("id"));');
	
	db.run('CREATE VIRTUAL TABLE "hadithexplanation"  USING fts4("explanation" VARCHAR,"lastUpdate" VARCHAR,"id" INTEGER,"isActive" INTEGER,"hadithId" INTEGER, PRIMARY KEY("id"));');
	
	db.run('CREATE VIRTUAL TABLE "hadithpublisher"  USING fts4("nameEnglish" VARCHAR, "nameBengali" VARCHAR, "lastUpdate" VARCHAR, "isActive" INTEGER,"id" INTEGER, PRIMARY KEY("id"));');
	
	db.run('CREATE VIRTUAL TABLE "hadithstatus"  USING fts4("colCode" VARCHAR,"statusEnglish" VARCHAR,"statusBengali" VARCHAR,"lastUpdate" VARCHAR,"isActive" INTEGER,"id" INTEGER, PRIMARY KEY("id"));');
	
	db.run('CREATE VIRTUAL TABLE "rabihadith"  USING fts4("sortBy" VARCHAR, "rabiEnglish" VARCHAR, "lastUpdate" VARCHAR, "rabiBengali" VARCHAR,"isActive" INTEGER,"id" INTEGER, PRIMARY KEY("id"));');
	
	db.run('CREATE VIRTUAL TABLE "hadithmain"  USING fts4("note" VARCHAR, "lastUpdate" VARCHAR, "hadithEnglish" VARCHAR, "hadithArabic" VARCHAR, "hadithBengali" VARCHAR, "checkStatus" INTEGER, "hadithNo" INTEGER, "id" INTEGER, "sequence" INTEGER, "isActive" INTEGER, "chapterId" INTEGER,"bookId" INTEGER, "publisherId" INTEGER, "rabiId" INTEGER,"sectionId" INTEGER, "statusId" INTEGER, PRIMARY KEY("id"));');
    */

    db.run('CREATE TABLE "hadithbook" ("id" INTEGER,"nameEnglish" VARCHAR,"nameBengali" VARCHAR,"lastUpdate" VARCHAR,"isActive" INTEGER,"priority" INTEGER,"publisherId" INTEGER, "section_number" INTEGER, "hadith_number" INTEGER, PRIMARY KEY("id"));');

    db.run('CREATE TABLE "hadithchapter" ("id" INTEGER, "nameEnglish" VARCHAR,"nameBengali" VARCHAR, "nameArabic" VARCHAR, "lastUpdate" VARCHAR,"isActive" INTEGER,"bookId" INTEGER,"sectionId" INTEGER,"hadith_number" INTEGER, PRIMARY KEY( "id"));');

    db.run('CREATE TABLE "hadithsection" ("nameEnglish" VARCHAR,"nameBengali" VARCHAR,"lastUpdate" VARCHAR,"isActive" INTEGER,"id" INTEGER,"serial" INTEGER,"bookId" INTEGER, "hadith_number" INTEGER, "range_start" INTEGER, "range_end" INTEGER, PRIMARY KEY("id"));');

    db.run('CREATE TABLE "hadithexplanation" ("explanation" VARCHAR,"lastUpdate" VARCHAR,"id" INTEGER,"isActive" INTEGER,"hadithId" INTEGER, PRIMARY KEY("id"));');

    db.run('CREATE TABLE "hadithpublisher" ("nameEnglish" VARCHAR, "nameBengali" VARCHAR, "lastUpdate" VARCHAR, "isActive" INTEGER,"id" INTEGER, PRIMARY KEY("id"));');

    db.run('CREATE TABLE "hadithstatus" ("colCode" VARCHAR,"statusEnglish" VARCHAR,"statusBengali" VARCHAR,"lastUpdate" VARCHAR,"isActive" INTEGER,"id" INTEGER, PRIMARY KEY("id"));');

    db.run('CREATE TABLE "rabihadith" ("sortBy" VARCHAR, "rabiEnglish" VARCHAR, "lastUpdate" VARCHAR, "rabiBengali" VARCHAR,"isActive" INTEGER,"id" INTEGER, PRIMARY KEY("id"));');

    db.run('CREATE TABLE "hadithmain" ("lastUpdate" VARCHAR, "checkStatus" INTEGER, "hadithNo" INTEGER, "id" INTEGER, "sequence" INTEGER, "isActive" INTEGER, "chapterId" INTEGER,"bookId" INTEGER, "publisherId" INTEGER, "rabiId" INTEGER,"sectionId" INTEGER, "statusId" INTEGER, PRIMARY KEY("id"));');

    db.run('CREATE VIRTUAL TABLE "hadithmain_data"  USING fts4("bookId" INTEGER, "sectionId" INTEGER, "note" TEXT, "hadithEnglish" TEXT, "hadithArabic" TEXT, "hadithBengali" TEXT);');

	 AddBook(function()
	 {
		 PrepareRangeQuaryFromBook(function(){
			 AddChapter(function()
			 {
				AddSection(function()
				{
					AddExplanation(function()
					{
						AddSource(function()
						{
							AddStatus(function()
							{
								AddRabihadith(function()
								{
									AddMain(function()
									 {
										 db.close();

										 MySqlConn.end();
									 });
								})
							})
						})
					})			
				})
			 })
		 })
	 })
 
});

function AddBook(cb)
{
	MySqlConn.query("SELECT * FROM `hadithbook`", function(err, rows, fields1) {
	  if (err) throw err;
	  
		var io = 1;
	  
		rows.forEach(function(row){
			MySqlConn.query("SELECT * FROM `hadithsection` WHERE BookID="+row.BookID, function(err, SectionNumber, fields) {
			  if (err) throw err;
			  
				MySqlConn.query("SELECT SectionID FROM `hadithmain` WHERE BookID="+row.BookID, function(err, HadithNumber, fields) {
				  if (err) throw err;
				  
					db.run("INSERT INTO hadithbook(id,publisherId,nameBengali,nameEnglish,priority,isActive,lastUpdate,section_number,hadith_number) VALUES ("+row.BookID+",'"+row.PubID+"','"+striptags(entities.encode(row.BookNameBD))+"','"+striptags(entities.encode(row.BookNameEN))+"',"+row.priority+","+row.Active+",'"+row.lastUpdate+"','"+SectionNumber.length+"','"+HadithNumber.length+"')");
					
					console.log(io+" < hadithbook > "+rows.length)
					
					if(io == rows.length)
					{		
						cb();
					}
					io = io + 1;
				 });
			 });
		});
	  //console.log('The solution is: ', rows[0]);
	 });
}

function PrepareRangeQuaryFromBook(cb)
{
	MySqlConn.query("SELECT * FROM `hadithbook`", function(err, books, fields1) {
	  if (err) throw err;
	  
		var io = 1;
	  
		books.forEach(function(book){
			
			MySqlConn.query("SELECT hadithmain.BookID, min(hadithmain.HadithNo)  AS min_HadithNo_1, hadithmain.SectionID AS SectionID_1, max(hadithmain.HadithNo)  AS max_HadithNo_1, hadithsection.SectionBD, count(hadithmain.HadithID)  AS count_HadithID_1, hadithmain.HadithActive, hadithsection.SecActive FROM (hadithmain LEFT JOIN hadithsection ON hadithsection.SectionID=hadithmain.SectionID) WHERE hadithmain.BookID="+book.BookID+" AND hadithmain.HadithActive=1  AND hadithsection.SecActive=1 GROUP BY hadithmain.BookID, hadithmain.SectionID, hadithsection.serial,  hadithsection.SectionBD, hadithmain.HadithActive, hadithsection.SecActive ORDER BY hadithsection.serial ASC", function(err, rangeDatas, fields1) {
			  if (err) throw err;
			  
				  rangeDatas.forEach(function(rangeData){
					  
					  if(!BookSectionWiseRange[rangeData.BookID])
					  {
							BookSectionWiseRange[rangeData.BookID]={};						  
					  }
					  
					  BookSectionWiseRange[rangeData.BookID][rangeData.SectionID_1]=rangeData;	
					  
					  if(io == books.length)
						{		
							cb();
						}
						io = io + 1;
					  
				  });
				  
			});
		  
		});
		
	});
}

function AddChapter(cb)
{
	MySqlConn.query("SELECT * FROM `hadithchapter`", function(err, rows, fields1) {
	  if (err) throw err;
	  
		var io = 1;
		//db.run("BEGIN TRANSACTION");
	  
		rows.forEach(function(row){
			MySqlConn.query("SELECT SectionID FROM `hadithmain` WHERE chapterID="+row.chapID, function(err, HadithNumber, fields) {
				  if (err) throw err;
				  
					db.run("INSERT INTO hadithchapter(id,bookId,sectionId,nameBengali,nameArabic,nameEnglish,isActive,lastUpdate,hadith_number) VALUES ("+row.chapID+","+row.BookID+","+row.SectionID+",'"+striptags(entities.encode(row.ChapterBG+""))+"','"+striptags(entities.encode(row.ChapterAR+""))+"','"+striptags(entities.encode(row.ChapterEN+""))+"',"+row.StatusActive+",'"+row.lastUpdate+"','"+HadithNumber.length+"')");
					
					console.log(io+" < hadithchapter > "+rows.length)
					
					if(io == rows.length)
					{		
						//db.run("END TRANSACTION");
						cb();
					}
					io = io + 1;
			});
		});
	  //console.log('The solution is: ', rows[0]);
	 });
}

function AddSection(cb)
{
	MySqlConn.query("SELECT * FROM `hadithsection`", function(err, rows, fields1) {
	  if (err) throw err;
	  
		var io = 1;
		//db.run("BEGIN TRANSACTION");
	  
		rows.forEach(function(row){
			MySqlConn.query("SELECT SectionID FROM `hadithmain` WHERE SectionID="+row.SectionID, function(err, HadithNumber, fields) {
				  if (err) throw err;
				  
					var startRange=0;
					var endRange=0;
				  
				  if (row.BookID in BookSectionWiseRange)
				  {
					  if (row.SectionID in BookSectionWiseRange[row.BookID])
					  {
						  startRange=BookSectionWiseRange[row.BookID][row.SectionID]["min_HadithNo_1"];
						  endRange=BookSectionWiseRange[row.BookID][row.SectionID]["max_HadithNo_1"];
					  }
				  }
				  
					db.run("INSERT INTO hadithsection (id,bookId,nameBengali,nameEnglish,isActive,lastUpdate,hadith_number,serial,range_start, range_end) VALUES ("+row.SectionID+","+row.BookID+",'"+striptags(entities.encode(row.SectionBD+""))+"','"+striptags(entities.encode(row.SectionEN+""))+"',"+row.SecActive+",'"+row.lastUpdate+"','"+HadithNumber.length+"','"+row.serial+"', "+startRange+", "+endRange+")");
					
					console.log(io+" < Section > "+rows.length)
					
					if(io == rows.length)
					{		
						//db.run("END TRANSACTION");
						cb();
					}
					io = io + 1;
			});
		});
	  //console.log('The solution is: ', rows[0]);
	 });
}

function AddExplanation(cb)
{
	MySqlConn.query("SELECT * FROM `hadithexplanation`", function(err, rows, fields) {
	  if (err) throw err;
	  
		var II = 1;
		
		//db.run("BEGIN TRANSACTION");

		rows.forEach(function(row){
			//console.log(row);
			
			//db.run("INSERT INTO hadithbook(id,publisherId,nameBengali,nameEnglish,priority,isActive,lastUpdate,section_number,hadith_number) VALUES ("+row.BookID+",'"+row.PubID+"','"+striptags(entities.encode(row.BookNameBD))+"','"+striptags(entities.encode(row.BookNameEN))+"',"+row.priority+","+row.Active+",'"+row.lastUpdate+"','0','0')");
			
			db.run("INSERT INTO hadithexplanation(id,hadithId,explanation,isActive,lastUpdate) VALUES ("+row.expID+","+row.hadithID+",'"+striptags(entities.encode(row.explanation+""))+"',"+row.active+",'"+row.lastUpdate+"')");
			
			console.log(II+" < hadithexplanation > "+rows.length)
			
			if(II == rows.length)
			{		
						
		
		//db.run("END TRANSACTION");
						cb();
			}
			II = II + 1;
		});
	  
	  //console.log('The solution is: ', rows[0]);
	 });
	
}

function AddSource(cb)
{
	MySqlConn.query("SELECT * FROM `hadithsource`", function(err, rows, fields) {
	  if (err) throw err;
	  
		var II = 1;
		
		//db.run("BEGIN TRANSACTION");

		rows.forEach(function(row){
			//console.log(row);
			
			//db.run("INSERT INTO hadithbook(id,publisherId,nameBengali,nameEnglish,priority,isActive,lastUpdate,section_number,hadith_number) VALUES ("+row.BookID+",'"+row.PubID+"','"+striptags(entities.encode(row.BookNameBD))+"','"+striptags(entities.encode(row.BookNameEN))+"',"+row.priority+","+row.Active+",'"+row.lastUpdate+"','0','0')");
			
			db.run("INSERT INTO hadithpublisher(id,nameBengali,nameEnglish,isActive,lastUpdate) VALUES ("+row.SourceID+",'"+striptags(entities.encode(row.SourceNameBD+""))+"','"+striptags(entities.encode(row.SourceNameEN+""))+"','"+row.SourceActive+"','"+row.lastUpdate+"')");
			
			console.log(II+" < hadithexplanation > "+rows.length)
			
			if(II == rows.length)
			{		
						
		
				//db.run("END TRANSACTION");
						cb();
			}
			II = II + 1;
		});
	  
	  //console.log('The solution is: ', rows[0]);
	 });
	
}

function AddStatus(cb)
{
	MySqlConn.query("SELECT * FROM `hadithstatus`", function(err, rows, fields) {
	  if (err) throw err;
	  
		var II = 1;
		
		//db.run("BEGIN TRANSACTION");

		rows.forEach(function(row){
			//console.log(row);
			
			db.run("INSERT INTO hadithstatus(id,statusBengali,statusEnglish,colCode,isActive,lastUpdate) VALUES ("+row.StatusID+",'"+striptags(entities.encode(row.StatusBG))+"','"+striptags(entities.encode(row.StatusEN))+"','"+row.ColCode+"',"+row.Active+",'"+row.lastUpdate+"')");
			
			console.log(II+" < hadithstatus > "+rows.length)
			
			if(II == rows.length)
			{		
				
		
				//db.run("END TRANSACTION");
				cb();
			}
			II = II + 1;
		});
	  
	  //console.log('The solution is: ', rows[0]);
	 });
	
}

function AddRabihadith(cb)
{
	MySqlConn.query("SELECT * FROM `rabihadith`", function(err, rows, fields) {
	  if (err) throw err;
	  
		var II = 1;
		
		//db.run("BEGIN TRANSACTION");

		rows.forEach(function(row){
			//console.log(row);
			
			db.run("INSERT INTO rabihadith(id,rabiBengali,rabiEnglish,sortBy,isActive,lastUpdate) VALUES ("+row.rabiID+",'"+striptags(entities.encode(row.rabiBangla+""))+"','"+striptags(entities.encode(row.rabiEnglish+""))+"','"+row.sortBy+"',"+row.active+",'"+row.lastUpdate+"');");
			
			console.log(II+" < rabihadith > "+rows.length)
			
			if(II == rows.length)
			{		
		
				//db.run("END TRANSACTION");
				cb();
			}
			II = II + 1;
		});
	  
	  //console.log('The solution is: ', rows[0]);
	 });
}



function AddMain(cb)
{
	MySqlConn.query("SELECT * FROM `hadithmain` ORDER BY SectionID ASC", function(err, rows, fields) {
	  if (err) throw err;
	  
		var II = 1;
		
		db.run("BEGIN TRANSACTION");

		rows.forEach(function(row){
			//console.log(row);
			
			//db.run("INSERT INTO hadithmain(id,sequence,note,lastUpdate,isActive,statusId,checkStatus,rabiId,bookId,publisherId,chapterId,hadithEnglish,sectionId,hadithNo,hadithArabic,hadithBengali) VALUES ("+row.HadithID+","+II+",'"+striptags(entities.encode(row.HadithNote+""))+"','"+row.DateUpdate+"',"+row.HadithActive+",'"+row.HadithStatus+"','"+row.CheckStatus+"','"+row.RabiID+"','"+row.BookID+"','"+row.SourceID+"','"+row.chapterID+"','"+striptags(entities.encode(row.EnglishHadith+""))+"','"+row.SectionID+"','"+row.HadithNo+"','"+striptags(entities.encode(row.ArabicHadith+""))+"','"+striptags(entities.encode(row.BanglaHadith+""))+"')");

            db.run("INSERT INTO hadithmain (id,sequence,lastUpdate,isActive,statusId,checkStatus,rabiId,bookId,publisherId,chapterId,sectionId,hadithNo) VALUES ("+row.HadithID+","+II+", '"+row.DateUpdate+"',"+row.HadithActive+",'"+row.HadithStatus+"','"+row.CheckStatus+"','"+row.RabiID+"','"+row.BookID+"','"+row.SourceID+"','"+row.chapterID+"','"+row.SectionID+"','"+row.HadithNo+"')");

            db.run("INSERT INTO hadithmain_data (docid, bookId, sectionId, note, hadithEnglish, hadithArabic, hadithBengali) VALUES ("+row.HadithID+", '"+row.BookID+"', '"+row.SectionID+"', '"+striptags(entities.encode(row.HadithNote+""))+"', '"+striptags(entities.encode(row.EnglishHadith+""))+"',  '"+striptags(entities.encode(row.ArabicHadith+""))+"', '"+striptags(entities.encode(row.BanglaHadith+""))+"')");
			
			if(II == rows.length)
			{
				db.run("END TRANSACTION");
				cb();
			}
			
			II = II + 1;
		});
	  
	  //console.log('The solution is: ', rows[0]);
	 });
}
 
//db.close();