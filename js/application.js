var fileSystem, folderList, basePath = '';
var app = {};
app.db = null;
app.insertRecord = function(name,path) {
    app.db.transaction(function(tx) {
        tx.executeSql("INSERT INTO cache_files(name, path) VALUES (?,?)",
                      [name, path],
                      app.onSuccess,
                      app.onError);
    });
}
app.onSuccess = function(tx, r) {
    console.log("Your SQLite query was successful!");
}

app.onError = function(tx, e) {
    console.log("SQLite Error: " + e.message);
}
var Application = {
  initApplication: function() {
    console.log("initApplication");
    /*$("#browseBtn").click(function(){
        //check if last selected folder was set
        if (typeof lastFolderSelected == 'undefined')
            lastFolderSelected = null;

        //create file chooser dialog parameters
        file_Browser_params = {
            directory_browser : true, //this is file browser. Default is false

            new_file_btn : false, //show new file button. Default is true

            new_folder_btn : false, //shoe new folder button. Default is true

            initial_folder : lastFolderSelected, //initial folder when dialog is displayed

            //callback function when file is selected
            on_file_select : function(fileEntry) {
                return false; //close dialog when any file is selected (tapped)
            },

            //callback function when folder is selected
            on_folder_select : function(dirEntry) {
                //don't do anything
            },

            //callback function when OK button is clicked
            on_ok : function (dirEntry) {
                //save the last folder path
                lastFolderSelected = dirEntry;
            }
    },*/
    //console.log(cordova.file);
    //window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, Application.gotFS, Application.fail);
    $(document)
      .on('pageinit', '#add-feed-page', function() {
        Application.initAddFeedPage();
      })
      .on('pageinit', '#list-feeds-page', function() {
    	var categParent = this.getAttribute('data-url').replace(/(.*?)parent=/g, '');
        Application.initListFeedPage(categParent);
      })
      .on('pageinit', '#show-feed-page', function() {
        var url = this.getAttribute('data-url').replace(/(.*?)url=/g, '');
        Application.initShowFeedPage(url);
      })
      .on('pageinit', '#aurelio-page', function() {
        Application.initAurelioPage();
      })
      .on('backbutton', function() {
        $.mobile.changePage('index.html');
      });
    Application.openLinksInApp();
  },
  buildFolders: function(fs) {
	  //Get directory tree and set root callback function
      fileSystem = fs;
      //navigator.notification.alert('in buildFolders: ' + JSON.stringify(fileSystem));
      Application.getFolder(basePath, function(folder) {
    	  //navigator.notification.alert('in getFolder(basePath): ' + basePath);
          folderList = folder;
          // Do stuff with completed folderList
          console.log("entry folderList " + JSON.stringify(folderList));
      });
  },
  getFolder: function(path, callback) {
	  console.log('in getFolder: ' + path);
	  //navigator.notification.alert('after basePath: ' + basePath);
	  // Recursively scan a directory structure from a base path
      fileSystem.root.getDirectory(path, {create: false}, function(dir) {
          var directoryReader = dir.createReader();
          //navigator.notification.alert('in getFolder directoryReader: ' + JSON.stringify(directoryReader));
          directoryReader.readEntries(function(entries) {
        	  console.log("entries " + JSON.stringify(entries));
              var entryList, i;
              if (entries.length > 0) {
                  // Sort entries case-insensitive, alphabetically
                  entries.sort(function(a, b) {
                      var aName = a.name.toLowerCase(), bName = b.name.toLowerCase();
                      return aName < bName ? -1 : bName < aName ? 1 : 0;
                  });
                  // Base entryList definition
                  entryList = {
                      name: dir.name,
                      id: dir.name.replace(/ /g, ''),
                      files: [],
                      folders: [],
                      root: false
                  };
                  console.log("entryList " + JSON.stringify(entryList));
                  if (dir.name === basePath) {
                      entryList.root = true;
                  }
                  // Process entries for current folder
                  for (i in entries) {
                      if (!entries[i].isFile) {
                          // Get child folder and have the callback function append it to it's parent entryList from the previous call to getFolder
                    	  Application.getFolder(entries[i].fullPath.replace(fileSystem.root.fullPath + '/', ''),
                              function(folder) {
                                  entryList.folders.push(folder);
                              });
                      } else {
                          // Add file to entryList
                          entries[i].file(function(fileObj) {
                              entryList.files.push({
                                  fullName: fileObj.name,
                                  fullPath: fileObj.fullPath,
                                  size: Math.round(fileObj.size / 1024)
                              });
                          }, function (error) { console.error('Failed to read file: ' + error.code); });
                      }
                  }
                  console.log("entryList " + JSON.stringify(entryList));
                  // For loop complete, send the current entryList to the callback function
                  callback(entryList);
              } else { console.log('Folder "' + dir.name + '" was empty, skipping.'); }
          }, function (error) { console.error('Failed to read directory entries: ' + error.code); });
      }, function (error) { console.error('Failed to get directory ' + path + ': ' + error.code); });
  },
  gotCacheFS: function(fileSystem) {
    console.log("gotCacheFS");
    //navigator.notification.alert('gotCacheFS');
    var reader = fileSystem.root.createReader();
    reader.readEntries(Application.gotCacheList, Application.fail);
  },
  gotCacheList: function(entries) {
	  console.log(entries);
	  //navigator.notification.alert('entries ' + JSON.stringify(entries));
  
    var i;
    for (i=0; i<entries.length; i++) {
    	// Get only directories entries[i].isDirectory = true
    	if(entries[i].isDirectory == true){
    		navigator.notification.alert('name: ' + entries[i].name + ' fullPath: ' + entries[i].fullPath);
    		// Get a directory reader
    		var directoryReader = entries[i].createReader();
    		//navigator.notification.alert('directoryReader ' + JSON.stringify(directoryReader));
    		// Get a list of all the entries in the directory
    		directoryReader.readEntries(Application.gotCacheList, Application.fail);
    	}
    	console.log(entries[i]);
    }
  },
  gotFS: function(fileSystem) {
    console.log("gotFS");
    navigator.notification.alert('gotFS');
    fileSystem.root.getFile("readme.txt", {
      create: true,
      exclusive: false
    }, Application.gotFileEntry, Application.fail);
    console.log("after gotFS");
  },
  gotFileEntry: function(fileEntry) {
    console.log("gotFileEntry");
    navigator.notification.alert('gotFileEntry');
    fileEntry.createWriter(Application.gotFileWriter, Application.fail);
  },
  gotFileWriter: function(writer) {
    writer.onwriteend = function(evt) {
      console.log("contents of file now 'some sample text'");
      navigator.notification.alert('contents of file now some sample text');
      writer.truncate(11);
      writer.onwriteend = function(evt) {
        console.log("contents of file now 'some sample'");
        navigator.notification.alert('contents of file now some sample');
        writer.seek(4);
        writer.write(" different text");
        writer.onwriteend = function(evt) {
          console.log("contents of file now 'some different text'");
          navigator.notification.alert('contents of file now some different text');
        }
      };
    };
    writer.write("some sample text");
  },
  fail: function(error) {
    console.log(error.code);
    navigator.notification.alert('error: ' + error.code);
  },
  writeLog: function(str) {
    if (!logOb) return;
    //var log = str + " [" + (new Date()) + "]\n";
    console.log("going to log " + str);
    navigator.notification.alert("going to log " + str);
    logOb.createWriter(function(fileWriter) {

      fileWriter.seek(fileWriter.length);
      navigator.notification.alert("After file writer seek");
      //var blob = new Blob([log], {type:'text/plain'});
      var blob = str;
      navigator.notification.alert("blob " + blob);
      fileWriter.write(blob);
      console.log("ok, in theory i worked");
      navigator.notification.alert("ok, in theory i worked");
    }, Application.fail);
  },
  utilCategProcess: function (key,value) {
	    var $feedsList = $('#feeds-list');
	    //console.log(key + " : "+value);
	    var htmlItems = '';
	    htmlItems += '<li><a href="list-feeds.html?parent=' + key + '">' + key + '</a></li>';
	    $feedsList.append(htmlItems);
  },
  utilTraverse: function (o, func) {
    for (var i in o) {
    	func.apply(this,[i,o[i]]);
        if (o[i] !== null && typeof(o[i])=="object") {
            //going on step down in the object tree!!
        	Application.utilTraverse(o[i],func);
        }
    }
  },
  utilCategListProcess: function (o, categParent) {
	//console.log("utilTraverse");
    for (var i in o) {
    	console.log("i: "+i);
    	if(i == categParent){
    		console.log("matched: "+categParent);
    		Application.utilCategParentProcess(o[i], categParent);
    	}else if (o[i] !== null && typeof(o[i])=="object") {
            //going on step down in the object tree!!
        	Application.utilCategListProcess(o[i], categParent);
        }
    }
  },
  utilCategParentProcess: function (subTree, categParent) {
	    //var $feedsList = $('#feeds-list');
	    var $feedsList = $('#feeds-list-'+categParent);
	    console.log("inner html: "+$feedsList.html());
	    //console.log(key + " : "+value);
	    var htmlItems = '';
	    //$feedsList.empty();
	    console.log("inner html1: "+$feedsList.html());
	    for (var i in subTree) {
	    	console.log("listing: "+i);
	    	htmlItems += '<li><a href="list-feeds.html?parent=' + i + '">' + i + '</a></li>';
	    }
	    console.log(htmlItems);
	    console.log($feedsList);
	    console.log("inner html2: "+$feedsList.html());
	    //$feedsList.html(htmlItems);
	    //$feedsList.listview('refresh');
	    //$feedsList.append(htmlItems);
	    //alert("pause");
	    $feedsList.append(htmlItems).listview('refresh');
	    console.log("inner html3: "+$feedsList.html());
	    //$feedsList.append(htmlItems);
  },
  initAddFeedPage: function() {
	  console.log("in initAddFeedPage");
	$("#clearCacheBtn").click(function(){
		console.log("in clearCacheBtn");
		// http://stackoverflow.com/questions/29678186/how-to-get-documents-in-an-android-directory-that-phonegap-will-see/29905718#29905718
		var localURLs    = [
		                    //cordova.file.dataDirectory,
		                    //cordova.file.documentsDirectory,
		                    //cordova.file.externalApplicationStorageDirectory,
		                    //cordova.file.externalCacheDirectory,
		                    cordova.file.externalRootDirectory
		                    //cordova.file.externalDataDirectory,
		                   // cordova.file.sharedDirectory,
		                   // cordova.file.syncedDataDirectory
		                ];
		var index = 0;
		var i;
		var statusStr = "";
		app.db = window.sqlitePlugin.openDatabase({name: "eschooltogoSQLitee.db", location: 'default'});
		app.db.transaction(function(transaction) {
			transaction.executeSql('CREATE TABLE IF NOT EXISTS cache_files (id integer primary key, name text, path text)', [],
			function(tx, result) {
				console.log("dbase Table created successfully: ");
			alert("Table created successfully");
			},
			function(error) {
			alert("Error occurred while creating the table.");
			});
			});
		var addFileEntry = function (entry) {
			console.log("nik- in addFileEntry");
		    var dirReader = entry.createReader();
		    dirReader.readEntries(
		        function (entries) {
		        	console.log("nik- entries: "+ JSON.stringify(entries));
		            var fileStr = "";
		            var i;
		            for (i = 0; i < entries.length; i++) {
		                if (entries[i].isDirectory === true) {
		                    // Recursive -- call back into this subdirectory
		                    addFileEntry(entries[i]);
		                } else {
		                   fileStr += (entries[i].fullPath + "<br>"); // << replace with something useful
		                   index++;
		                   console.log("dbase before insertinggg: ");
		                   app.insertRecord(entries[i].name,entries[i].fullPath);
		                   /*
		                   var title="sundaravel";
		                   var desc="phonegap freelancer";
		                   app.db.transaction(function(transaction) {
		                	   console.log("dbase inserting: "+ JSON.stringify(entries[i]));
		                	   //console.log("dbase inserting: "+entries[i].name + entries[i].fullPath);  
		                   var executeQuery = "INSERT INTO cache_files (name, path) VALUES (?,?)";
		                   transaction.executeSql(executeQuery, [entries[i].name,entries[i].fullPath]
		                   , function(tx, result) {
		                   //alert('Inserted');
		                	   console.log("dbase row inserted: ");
		                   },
		                   function(error){
		                   alert('Error occurred');
		                   });
		                   });*/
		                   //var app.db = window.sqlitePlugin.openDatabase({name: "eschooltogoSQLite.db", location: 'default'});
		                  /* app.db.transaction(function(transaction) {
		                	   console.log("dbase inserting: "+entries[i].name + " -> " + entries[i].fullPath);
		                	   var executeQuery = "INSERT INTO cache_files (name, path) VALUES (?,?)";
		                	   transaction.executeSql(executeQuery, [entries[i].name,entries[i].fullPath]
		                	   , function(tx, result) {
		                	   //alert('Inserted');
		                		   console.log("dbase row inserted: ");
		                	   },
		                	   function(error){
		                	   alert('Error occurred in inserting into database table.');
		                	   });
		                   });*/
		                   console.log("dbase after inserting: ");
		                }
		            }
		            // add this directory's contents to the status
		            statusStr += fileStr;
		            console.log("nik- statusStr" + statusStr);
		            // display the file list in #results
		            if (statusStr.length > 0) {
		              $("#results").html(statusStr);
		              
	                  /*window.resolveLocalFileSystemURL(cordova.file.externalDataDirectory, function(dir) {
	                    console.log("got main dir", dir);
	                    navigator.notification.alert("got main dir" + JSON.stringify(dir));
	                    dir.getFile("categories.json", {
	                      create: true
	                    }, function(file) {
	                      console.log("got the file", file);
	                      navigator.notification.alert("got the file" + JSON.stringify(file));
	                      logOb = file;
	                      Application.writeLog(decoded);
	                    });
	                  });*/
		            } 
		        },
		        function (error) {
		            console.log("readEntries error: " + error.code);
		            statusStr += "<p>readEntries error: " + error.code + "</p>";
		        }
		    );
		};
		var addError = function (error) {
		    console.log("getDirectory error: " + error.code);
		    statusStr += "<p>getDirectory error: " + error.code + ", " + error.message + "</p>";
		};
		for (i = 0; i < localURLs.length; i++) {
		    if (localURLs[i] === null || localURLs[i].length === 0) {
		        continue; // skip blank / non-existent paths for this platform
		    }
		    console.log("nik- calling addFileEntry" + localURLs[i]);
		    window.resolveLocalFileSystemURL(localURLs[i], addFileEntry, addError);
		}
		// https://gist.github.com/chuckak/5722350
		//window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, Application.buildFolders, Application.fail);
		//window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, Application.gotCacheFS, Application.fail);
		//window.requestFileSystem(cordova.file.externalDataDirectory, 0, Application.gotCacheFS, Application.fail);
		console.log("cleared cache");
	});
    $('#add-feed-form').submit(function(event) {
      event.preventDefault();
      var feedName = $('#feed-name').val().trim();
      var feedUrl = $('#feed-url').val().trim();
      /*
       * Download Categories JSON API
       */
      $.ajaxSetup({
        cache: false
      });
      var api_url = "http://opencurricula.technikh.com/api/v1/categories/";
      console.log("test " + api_url);
      $.ajax({
        url: api_url,
        success: function(result) {
          console.log(result);
          var decoded = $('<div/>').html(result).text();
          console.log(decoded);

          console.log(JSON.parse(decoded));
          /*var categoriesObj = JSON.parse(decoded);
          Application.utilTraverse(categoriesObj, Application.utilCategProcess);*/
      
          //window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function(dir) { // For local chrome browser testing
          window.resolveLocalFileSystemURL(cordova.file.externalDataDirectory, function(dir) {
            console.log("got main dir", dir);
            navigator.notification.alert("got main dir" + JSON.stringify(dir));
            dir.getFile("categories.json", {
              create: true
            }, function(file) {
              console.log("got the file", file);
              navigator.notification.alert("got the file" + JSON.stringify(file));
              logOb = file;
              Application.writeLog(decoded);
            });
          });
        }
      });
      /*
               $.getJSON(api_url, function(data)
               {
                   // process the data
              	 console.log(data);
              	 navigator.notification.alert("Data: " + JSON.stringify(data));
                   $.ajaxSetup({ cache: true });
               });
               */
      /*
      window.resolveLocalFileSystemURL(cordova.file.externalDataDirectory, function(dir) {
          console.log("got main dir",dir);
          navigator.notification.alert("got main dir" + JSON.stringify(dir));
          dir.getFile("eschool.txt", {create:true}, function(file) {
              console.log("got the file", file);
              navigator.notification.alert("got the file" + JSON.stringify(file));
              logOb = file;
              Application.writeLog("App started");          
          });
      });*/
      //window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, Application.gotFS, Application.fail);
      return false;
      if (feedName === '') {
        navigator.notification.alert('Name field is required and cannot be empty', function() {}, 'Error');
        return false;
      }
      if (feedUrl === '') {
        navigator.notification.alert('URL field is required and cannot be empty', function() {}, 'Error');
        return false;
      }

      if (Feed.searchByName(feedName) === false && Feed.searchByUrl(feedUrl) === false) {
        var feed = new Feed(feedName, feedUrl);
        feed.add();
        navigator.notification.alert('Feed saved correctly', function() {
          $.mobile.changePage('index.html');
        }, 'Success');
      } else {
        navigator.notification.alert('Feed not saved! Either the Name or the Url specified is already in use', function() {}, 'Error');
      }
      return false;
    });
  },
  initListFeedPage: function(categParent) {
	  console.log("dbase parent: " + categParent);
	  if(categParent.indexOf("list-feeds.html") !== -1){
		  // Contains list-feeds.html.
	  categParent = "eschool2go";
  		}
	// change ID to be dynamic
	    var hyphened_categParent = categParent.replace(/\//g, '-');
	    $('#feeds-list').attr("id","feeds-list-"+hyphened_categParent);
	    console.log("dbase 1: " + hyphened_categParent);
	    var $feedsList = $('#feeds-list-'+hyphened_categParent);
	    console.log("dbase 2: " + hyphened_categParent);
	  app.db = window.sqlitePlugin.openDatabase({name: "eschooltogoSQLitee.db", location: 'default'});
	  app.db.transaction(function(transaction) {
		  transaction.executeSql("SELECT * FROM cache_files WHERE path LIKE '/" + categParent + "/%'", [], function (tx, results) {
			  var len = results.rows.length, i;
			  console.log("dbase len: " + len);
			  //$("#rowCount").append(len);
			  var listItemsArray = [];
			  for (i = 0; i < len; i++){
				  //$("#TableData").append("<tr><td>"+results.rows.item(i).id+"</td><td>"+results.rows.item(i).name+"</td><td>"+results.rows.item(i).path+"</td></tr>");
				  console.log("dbase path: " + results.rows.item(i).path);
				  var filePathArray = results.rows.item(i).path.split("/");
				  var categParentNumOfSlashes = (categParent.split("/").length - 1);
				  console.log("dbase categParentNumOfSlashes: " + categParentNumOfSlashes);
				  var listItemName = filePathArray[2 + categParentNumOfSlashes];
				  console.log("dbase listItemName: " + listItemName);
				  listItemsArray.push(listItemName);
			  	}
			  // Remove duplicates http://stackoverflow.com/questions/9229645/remove-duplicates-from-javascript-array
			  var uniqueListItems = [];
			  $.each(listItemsArray, function(i, el){
			      if($.inArray(el, uniqueListItems) === -1) uniqueListItems.push(el);
			  });
			  console.log("dbase uniqueListItems " + JSON.stringify(uniqueListItems));
			  $.each(uniqueListItems, function(i, el){
				  // If el is a file with an extension for video file, 
				  if(el.endsWith(".mp4")){
					  var htmlItems = '<li><span onclick="window.plugins.fileOpener.open(\'file:///sdcard/'+categParent+'/'+el+'\')">' + el + '</span></li>';
				  }else{
					  var htmlItems = '<li><a href="list-feeds.html?parent=' + categParent + "/" + el + '">' + el + '</a></li>';
			  	  }
				  $feedsList.append(htmlItems);
			  });
			  $feedsList.listview('refresh');
		  }, null);
	  });
	  /*console.log("parent: " + categParent);
	  if(categParent.indexOf("list-feeds.html") !== -1){
		  // Contains list-feeds.html.
	  categParent = "ssc";
  		}
	  //navigator.notification.alert("before changing ID " + categParent);
    // change ID to be dynamic
    $('#feeds-list').attr("id","feeds-list-"+categParent);
    var $feedsList = $('#feeds-list-'+categParent);
    //navigator.notification.alert("after changing ID ");
    //var htmlItems = '<li>my test</li>';
    //$feedsList.append(htmlItems);
    // If local testing
    $.ajaxSetup({
        cache: false
      });
      var api_url = "http://opencurricula.technikh.com/api/v1/categories/";
      console.log("test " + api_url);
      //navigator.notification.alert("before calling API  AJAX ");
      $.ajax({
        url: api_url,
        success: function(result) {
          console.log(result);
          //navigator.notification.alert("downloaded API success" + JSON.stringify(result));
          var decoded = $('<div/>').html(result).text();
          var categoriesObj = JSON.parse(decoded);
          console.log(categoriesObj);
          //navigator.notification.alert("categoriesObj" + JSON.stringify(categoriesObj));
          Application.utilCategListProcess(categoriesObj, categParent);
          //$feedsList.listview('refresh');
        }
      });*/
    /*
     * Read local Categories.json file
     * If it doesn't exist download if connected to internet
     */
    /*navigator.notification.alert("got the file" + JSON.stringify(logOb));
    logOb.file(function(file) {
      var reader = new FileReader();

      reader.onloadend = function(e) {
        console.log(this.result);
        navigator.notification.alert("Reading: " + this.result);
        
        var categoriesObj = JSON.parse(this.result);
        Application.utilTraverse(categoriesObj, Application.utilCategProcess);
        $feedsList.append(htmlItems).listview('refresh');
      };

      reader.readAsText(file);
    }, Application.fail);*/
    /*
    var items = Feed.getFeeds();
    var htmlItems = '';

    $feedsList.empty();
    items = items.sort(Feed.compare);
    for (var i = 0; i < items.length; i++) {
       htmlItems += '<li><a href="show-feed.html?url=' + items[i].url + '">' + items[i].name + '</a></li>';
    }
    $feedsList.append(htmlItems).listview('refresh');*/
  },
  initShowFeedPage: function(url) {
    var step = 10;
    var loadFeed = function() {
      var currentEntries = $('#feed-entries').find('div[data-role=collapsible]').length;
      var entriesToShow = currentEntries + step;
      $.ajax({
        url: 'https://ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=' + entriesToShow + '&q=' + encodeURI(url),
        dataType: 'json',
        beforeSend: function() {
          $.mobile.loading('show', {
            text: 'Please wait while retrieving data...',
            textVisible: true
          });
        },
        success: function(data) {
          var $list = $('#feed-entries');
          if (data.responseData === null) {
            navigator.notification.alert('Unable to retrieve the Feed. Invalid URL', function() {}, 'Error');
            return;
          }
          var items = data.responseData.feed.entries;

          var $post;
          if (currentEntries === items.length) {
            navigator.notification.alert('No more entries to load', function() {}, 'Info');
            return;
          }
          for (var i = currentEntries; i < items.length; i++) {
            $post = $('<div data-role="collapsible" data-expanded-icon="arrow-d" data-collapsed-icon="arrow-r" data-iconpos="right">');
            $post
              .append($('<h2>').text(items[i].title))
              .append($('<h3>').html('<a href="' + items[i].link + '" target="_blank">' + items[i].title + '</a>')) // Add title
              .append($('<p>').html(items[i].contentSnippet)) // Add description
              .append($('<p>').text('Author: ' + items[i].author))
              .append(
                $('<a href="' + items[i].link + '" target="_blank" data-role="button">')
                .text('Go to the Article')
                .button()
                .click(function(event) {
                  if (Application.checkRequirements() === false) {
                    event.preventDefault();
                    navigator.notification.alert('The connection is off, please turn it on', function() {}, 'Error');
                    return false;
                  }
                  $(this).removeClass('ui-btn-active');
                })
              );
            $list.append($post);
          }
          $list.collapsibleset('refresh');
        },
        error: function() {
          navigator.notification.alert('Unable to retrieve the Feed. Try later', function() {}, 'Error');
        },
        complete: function() {
          $.mobile.loading('hide');
        }
      });
    };
    $('#show-more-entries').click(function() {
      loadFeed();
      $(this).removeClass('ui-btn-active');
    });
    $('#delete-feed').click(function() {
      Feed.searchByUrl(url).delete();
      navigator.notification.alert('Feed deleted', function() {
        $.mobile.changePage('list-feeds.html');
      }, 'Success');
    });
    if (Application.checkRequirements() === true) {
      loadFeed();
    } else {
      navigator.notification.alert('To use this app you must enable your internet connection', function() {}, 'Warning');
    }
  },
  initAurelioPage: function() {
    $('a[target=_blank]').click(function() {
      $(this).closest('li').removeClass('ui-btn-active');
    });
  },
  checkRequirements: function() {
    console.log(navigator);
    return true;
    if (navigator.connection.type === Connection.NONE) {
      return false;
    }

    return true;
  },
  updateIcons: function() {
	  console.log("in updateIcons");
    var $buttons = $('a[data-icon], button[data-icon]');
    var isMobileWidth = ($(window).width() <= 480);
    isMobileWidth ? $buttons.attr('data-iconpos', 'notext') : $buttons.removeAttr('data-iconpos');
  },
  openLinksInApp: function() {
    $(document).on('click', 'a[target=_blank]', function(event) {
      event.preventDefault();
      window.open($(this).attr('href'), '_blank');
    });
  }
};
