var Application = {
   initApplication: function () {
	   console.log("initApplication");
	   console.log(cordova.file);
	   //window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, Application.gotFS, Application.fail);
      $(document)
         .on('pageinit', '#add-feed-page', function () {
            Application.initAddFeedPage();
         })
         .on('pageinit', '#list-feeds-page', function () {
            Application.initListFeedPage();
         })
         .on('pageinit', '#show-feed-page', function () {
            var url = this.getAttribute('data-url').replace(/(.*?)url=/g, '');
            Application.initShowFeedPage(url);
         })
         .on('pageinit', '#aurelio-page', function () {
            Application.initAurelioPage();
         })
         .on('backbutton', function () {
            $.mobile.changePage('index.html');
         });
      Application.openLinksInApp();
   },
   gotFS: function (fileSystem) {
	   console.log("gotFS");
	   navigator.notification.alert('gotFS');
       fileSystem.root.getFile("readme.txt", {create: true, exclusive: false}, Application.gotFileEntry, Application.fail);
       console.log("after gotFS");
   },
   gotFileEntry: function (fileEntry) {
	   console.log("gotFileEntry");
	   navigator.notification.alert('gotFileEntry');
       fileEntry.createWriter(Application.gotFileWriter, Application.fail);
   },
   gotFileWriter: function (writer) {
       writer.onwriteend = function(evt) {
           console.log("contents of file now 'some sample text'");
           navigator.notification.alert('contents of file now some sample text');
           writer.truncate(11);  
           writer.onwriteend = function(evt) {
               console.log("contents of file now 'some sample'");
               navigator.notification.alert('contents of file now some sample');
               writer.seek(4);
               writer.write(" different text");
               writer.onwriteend = function(evt){
                   console.log("contents of file now 'some different text'");
                   navigator.notification.alert('contents of file now some different text');
               }
           };
       };
       writer.write("some sample text");
   },
   fail: function (error) {
       console.log(error.code);
       navigator.notification.alert('error: '+error.code);
   },
   writeLog: function (str) {
	    if(!logOb) return;
	    var log = str + " [" + (new Date()) + "]\n";
	    console.log("going to log "+log);
	    navigator.notification.alert("going to log " + log);
	    logOb.createWriter(function(fileWriter) {
	        
	        fileWriter.seek(fileWriter.length);
	        navigator.notification.alert("After file writer seek");
	        //var blob = new Blob([log], {type:'text/plain'});
	        var blob = "eschool";
	        navigator.notification.alert("blob " + blob);
	        fileWriter.write(blob);
	        console.log("ok, in theory i worked");
	        navigator.notification.alert("ok, in theory i worked");
	    }, Application.fail);
	},
   initAddFeedPage: function () {
      $('#add-feed-form').submit(function (event) {
         event.preventDefault();
         var feedName = $('#feed-name').val().trim();
         var feedUrl = $('#feed-url').val().trim();
         /*
          * Download Categories JSON API
          */
         window.resolveLocalFileSystemURL(cordova.file.externalDataDirectory, function(dir) {
             console.log("got main dir",dir);
             navigator.notification.alert("got main dir" + JSON.stringify(dir));
             dir.getFile("eschool.txt", {create:true}, function(file) {
                 console.log("got the file", file);
                 navigator.notification.alert("got the file" + JSON.stringify(file));
                 logOb = file;
                 Application.writeLog("App started");          
             });
         });
         //window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, Application.gotFS, Application.fail);
         return false;
         if (feedName === '') {
            navigator.notification.alert('Name field is required and cannot be empty', function () {
            }, 'Error');
            return false;
         }
         if (feedUrl === '') {
            navigator.notification.alert('URL field is required and cannot be empty', function () {
            }, 'Error');
            return false;
         }

         if (Feed.searchByName(feedName) === false && Feed.searchByUrl(feedUrl) === false) {
            var feed = new Feed(feedName, feedUrl);
            feed.add();
            navigator.notification.alert('Feed saved correctly', function () {
               $.mobile.changePage('index.html');
            }, 'Success');
         } else {
            navigator.notification.alert('Feed not saved! Either the Name or the Url specified is already in use', function () {
            }, 'Error');
         }
         return false;
      });
   },
   initListFeedPage: function () {
      var $feedsList = $('#feeds-list');
      var items = Feed.getFeeds();
      var htmlItems = '';

      $feedsList.empty();
      items = items.sort(Feed.compare);
      for (var i = 0; i < items.length; i++) {
         htmlItems += '<li><a href="show-feed.html?url=' + items[i].url + '">' + items[i].name + '</a></li>';
      }
      $feedsList.append(htmlItems).listview('refresh');
   },
   initShowFeedPage: function (url) {
      var step = 10;
      var loadFeed = function () {
         var currentEntries = $('#feed-entries').find('div[data-role=collapsible]').length;
         var entriesToShow = currentEntries + step;
         $.ajax({
            url: 'https://ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=' + entriesToShow + '&q=' + encodeURI(url),
            dataType: 'json',
            beforeSend: function () {
               $.mobile.loading('show', {
                  text: 'Please wait while retrieving data...',
                  textVisible: true
               });
            },
            success: function (data) {
               var $list = $('#feed-entries');
               if (data.responseData === null) {
                  navigator.notification.alert('Unable to retrieve the Feed. Invalid URL', function () {
                  }, 'Error');
                  return;
               }
               var items = data.responseData.feed.entries;

               var $post;
               if (currentEntries === items.length) {
                  navigator.notification.alert('No more entries to load', function () {
                  }, 'Info');
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
                           .click(function (event) {
                              if (Application.checkRequirements() === false) {
                                 event.preventDefault();
                                 navigator.notification.alert('The connection is off, please turn it on', function () {
                                 }, 'Error');
                                 return false;
                              }
                              $(this).removeClass('ui-btn-active');
                           })
                     );
                  $list.append($post);
               }
               $list.collapsibleset('refresh');
            },
            error: function () {
               navigator.notification.alert('Unable to retrieve the Feed. Try later', function () {
               }, 'Error');
            },
            complete: function () {
               $.mobile.loading('hide');
            }
         });
      };
      $('#show-more-entries').click(function () {
         loadFeed();
         $(this).removeClass('ui-btn-active');
      });
      $('#delete-feed').click(function () {
         Feed.searchByUrl(url).delete();
         navigator.notification.alert('Feed deleted', function () {
            $.mobile.changePage('list-feeds.html');
         }, 'Success');
      });
      if (Application.checkRequirements() === true) {
         loadFeed();
      } else {
         navigator.notification.alert('To use this app you must enable your internet connection', function () {
         }, 'Warning');
      }
   },
   initAurelioPage: function () {
      $('a[target=_blank]').click(function () {
         $(this).closest('li').removeClass('ui-btn-active');
      });
   },
   checkRequirements: function () {
	   console.log(navigator);
	   return true;
      if (navigator.connection.type === Connection.NONE) {
         return false;
      }

      return true;
   },
   updateIcons: function () {
      var $buttons = $('a[data-icon], button[data-icon]');
      var isMobileWidth = ($(window).width() <= 480);
      isMobileWidth ? $buttons.attr('data-iconpos', 'notext') : $buttons.removeAttr('data-iconpos');
   },
   openLinksInApp: function () {
      $(document).on('click', 'a[target=_blank]', function (event) {
         event.preventDefault();
         window.open($(this).attr('href'), '_blank');
      });
   }
};
