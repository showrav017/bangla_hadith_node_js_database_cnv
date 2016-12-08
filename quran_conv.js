var mysql      = require('mysql');
var sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

fs.unlink('m.tar', (err) => {
  if (err) throw err;
  console.log('successfully deleted m.tar');
});

var db = new sqlite3.Database('m.tar');
var striptags = require('striptags');
var Entities = require('html-entities').XmlEntities; 
entities = new Entities();

var MySqlConn = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'quran_db'
});

MySqlConn.connect();

var BookSectionWiseRange = {};

console.log("Hi Genius, It will take a long time to finish. So grab some coffee and chill.");

db.serialize(function() {
	
	db.run('CREATE TABLE "android_metadata" ("locale" TEXT);INSERT INTO android_metadata VALUES("en_US");');
	
	db.run('INSERT INTO android_metadata VALUES("en_US");');

    db.run('CREATE TABLE "ayats" ("ayat_id" INTEGER , "id" INTEGER , "if_sajda" INTEGER , "sountTrackName" VARCHAR , "sura_id" INTEGER , PRIMARY KEY ("id") );');
	
	db.run('CREATE TABLE "sanenuzul" ("id" INTEGER , "sura_id" INTEGER , PRIMARY KEY ("id") );');
	
	db.run('CREATE TABLE "sura" ("has_bismillah" INTEGER , "id" INTEGER , "name_ar" VARCHAR , "name_bn" VARCHAR , "name_en" VARCHAR , "no_of_vers" INTEGER , "position" INTEGER , "type" INTEGER , PRIMARY KEY ("id") );');
	
	db.run('CREATE TABLE "tafsir" ("ayat_id" INTEGER , "id" INTEGER , "sura_id" INTEGER , PRIMARY KEY ("id") );');
	
	db.run('CREATE VIRTUAL TABLE "ayat_fts"  USING fts4("arabic" TEXT, "trans_bn_bayan" TEXT , "trans_bn_muzibur" TEXT , "trans_bn_taisirul" TEXT, "notes" TEXT);');
	
	db.run('CREATE VIRTUAL TABLE "sanenuzul_fts"  USING fts4("text_1" TEXT);');
	
	db.run('CREATE VIRTUAL TABLE "tafsir_fts"  USING fts4("translation" TEXT, "tafsir_1" TEXT, "tafsir_note" TEXT);');

    AddSura(function()
	{
		AddAyats(function ()
		{
            AddSaneNuzul(function ()
			{
                AddTafsir(function ()
				{
                    db.close();
                    MySqlConn.end();
                })
            })
        })
    })
});


function AddAyats(cb)
{
    console.log("Function 'AddAyats' called");

	MySqlConn.query("SELECT * FROM `quran_text`", function(err, rows, fields1) {
	  if (err) throw err;

        var io = 1;

        //db.run("BEGIN TRANSACTION");

		rows.forEach(function(row){

            db.run('INSERT INTO "ayats" ("id", "ayat_id", "if_sajda", "sountTrackName", "sura_id") VALUES ('+row.id+', '+row.aya+','+row.sajda+', "'+row.audioLink+'", '+row.sura+')',
				function () {

                db.run('INSERT INTO "ayat_fts" ("docid", "arabic", "trans_bn_bayan", "trans_bn_muzibur", "trans_bn_taisirul", "notes") VALUES ('+row.id+', "'+striptags(entities.encode(row.Arabic+""))+'", "'+striptags(entities.encode(row.bayan+""))+'", "'+striptags(entities.encode(row.muzibur+""))+'", "'+striptags(entities.encode(row.taisirul+""))+'", "'+striptags(entities.encode(row.notes+""))+'")',
					function ()
					{
                        console.log("Current ROW: "+io+" out of "+rows.length+" Rows")

                        if(io == rows.length)
                        {
                            //db.run("END TRANSACTION");
                            console.log("Function 'AddAyats' finished.");
                            cb();
                        }
                        io = io + 1;
                	}
                );

            });
		});
	 });
}

function AddSura(cb)
{
    console.log("Function 'AddSura' called");

    MySqlConn.query("SELECT * FROM `quran_surahlist`", function(err, rows, fields1) {
        if (err) throw err;

        var io = 1;

        rows.forEach(function(row){

            db.run('INSERT INTO "sura" ("has_bismillah", "id", "name_ar", "name_en", "name_bn", "no_of_vers", "position", "type") VALUES ("'+row.hasBismillah+'", "'+row.suraID+'", "'+striptags(entities.encode(row.suraNameAR+""))+'", "'+striptags(entities.encode(row.suraNameEN+""))+'", "'+striptags(entities.encode(row.suraNameBN+""))+'", "'+row.totalVers+'", "'+row.suraNo+'", "'+row.suraType+'")', function () {

                console.log("Current ROW: "+io+" out of "+rows.length+" Rows")

                if(io == rows.length)
                {
                    console.log("Function 'AddSura' finished.");
                    cb();
                }
                io = io + 1;
            });
        });
    });
}

function AddSaneNuzul(cb)
{

    console.log("Function 'AddSaneNuzul' called");

    MySqlConn.query("SELECT * FROM `shanenuzul`", function(err, rows, fields1) {
        if (err) throw err;

        var io = 1;

        rows.forEach(function(row){

            db.run('INSERT INTO "sanenuzul" ("id", "sura_id") VALUES ("'+row.nuzulid+'", "'+row.surahid+'")', function () {

                db.run('INSERT INTO "sanenuzul_fts" ("docid", "text_1") VALUES ("'+row.nuzulid+'", "'+striptags(entities.encode(row.nuzuldetail+""))+'")', function () {

                    console.log("Current ROW: "+io+" out of "+rows.length+" Rows")

                    if(io == rows.length)
                    {
                        console.log("Function 'AddSaneNuzul' finished.");
                        cb();
                    }
                    io = io + 1;
                });
            });
        });
    });
}

function AddTafsir(cb)
{

    console.log("Function 'AddTafsir' called");

    MySqlConn.query("SELECT * FROM `tafsir`", function(err, rows, fields1) {
        if (err) throw err;

        var io = 1;

        rows.forEach(function(row){

            db.run('INSERT INTO "tafsir" ("id", "ayat_id", "sura_id") VALUES ("'+row.tafsirid+'", "'+row.ayanumber+'", "'+row.saurahid+'")', function () {

                db.run('INSERT INTO "tafsir_fts" ("docid", "translation", "tafsir_1", "tafsir_note") VALUES ("'+row.tafsirid+'", "'+striptags(entities.encode(row.ayaTrans+""))+'", "'+striptags(entities.encode(row.tafsir1+""))+'", "'+striptags(entities.encode(row.tafsirnote+""))+'")', function () {

                    console.log("Current ROW: "+io+" out of "+rows.length+" Rows")

                    if(io == rows.length)
                    {
                        console.log("Function 'AddTafsir' finished.");
                        cb();
                    }
                    io = io + 1;
                });
            });
        });
    });
}