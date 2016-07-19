'use strict';

var myDoc = {
  title: "My document",
  author: "Sonny Piers",
  frames: [
    {
      content: content1
    },
  ]
}

window.URL = window.URL || window.webkitURL

function test() {
  var elem = document.getElementById("editor");
  elem.style.backgroundColor = 'white';
  elem.contentEditable = false;
  elem.requestFullScreen = elem.requestFullScreen || elem.mozRequestFullScreen || webkitRequestFullScreen;
  elem.requestFullScreen();
}

var Editor = {
  newFrame: function() {
    var id = myDoc.frames.length;
    var frame = {
      content: defaultContent
    };
    myDoc.frames.push(frame);
    UI.addThumbnail(id);
    UI.switchToFrame(id);
    editor2Canvas();
  },
}

var UI = {
  addThumbnail: function(aFrameId) {
    var li = document.createElement('li');
    li.addEventListener('click', function() {
      var frameId = this.getAttribute('data-frame-id');
      UI.switchToFrame(frameId);
      
    });
    li.classList.add('thumbnail');
    li.setAttribute('data-frame-id', aFrameId);
    var img = document.createElement('img');
    img.src = "white.png"
    li.appendChild(img);
    var thumbnails = document.getElementById('thumbnails');
    thumbnails.insertBefore(li, document.getElementById('newFrame'));
  },
  switchToFrame: function(aFrameId) {
    UI.editor.innerHTML = myDoc.frames[aFrameId].content;
    UI.editor.setAttribute('data-frame-id',  aFrameId);
    var thumbnails = document.querySelectorAll('.thumbnail');
    var thumbnail = document.querySelector('.thumbnail[data-frame-id="' + aFrameId + '"]');
    for (var i = 0; i < thumbnails.length; i++) {
      thumbnails[i].classList.remove('active');
    }
    thumbnail.classList.add('active');
  }
}
document.addEventListener('mozfullscreenchange', function() {
  if (!document.mozFullScreenElement) {
    UI.editor.contentEditable = true;
  }
});
window.addEventListener('load', function() {
  //~ Aloha.jQuery('#editor').aloha();
  //~ return;
  
  UI.editor = document.getElementById('editor');
  var editor = UI.editor;

  var i = 0;
  myDoc.frames.forEach(function(frame) {
    UI.addThumbnail(i);
    i++;
  });

  //Editor stuff
  var observer = new window.MutationObserver(function(mutations) {
    var foo = false;
    if (mutations.length === 1) {
      if (mutations[0].target === editor) {
        return foo = true;
      }
      if (mutations[0].type === 'attributes') {
        if (mutations[0].attributeName === '_moz_resizing') {
          return foo = true;
        }
      }
    }
    //~ else {
      //~ mutations.forEach(function(mutation) {
        //~ console.log(mutation.target);
        //~ console.log(mutation.type);
        //~ console.log(mutation.attributeName);
      //~ })
    //~ }
    if (foo)
      return;

    editor2Canvas();
    var frameId = UI.editor.getAttribute('data-frame-id');
    myDoc.frames[frameId].content = UI.editor.innerHTML;
  });
  observer.observe(editor, {
    childList: true,
    attributes: true,
    characterData: true,
    subtree: true,
    attributeOldValue: true,
    characterDataOldValue: true,
    //~ DOMString[] attributeFilter
  });
  
  UI.switchToFrame(0);
  editor2Canvas();
  //~ UI.editor.innerHTML = myDoc.frames[0].content;
  //~ UI.editor.setAttribute('data-frame-id', 0);
  
  //newFrame
  var newPageButton = document.getElementById('newFrame');
  newPageButton.addEventListener('click', function() {
    Editor.newFrame();
  });


});

var HTML2Canvas = function(aHTML) {
  
}

function replaceImages (doc) {
  var imgs = [...doc.querySelectorAll('img')]
  var promises = imgs.map(function (img) {
    return new Promise(function (resolve) {
      img.removeAttribute('_moz_resizing');
      var canvas = document.createElement('canvas')
      canvas.width = img.width;
      canvas.height = img.height;
      var ctx = canvas.getContext('2d');   
      ctx.drawImage(img, 0, 0, img.width, img.height);
      canvas.toBlob(function (blob) {
        img.src = window.URL.createObjectURL(blob)
        img.addEventListener('load', function () {
          window.URL.revokeObjectURL(blob)
        })
        resolve()
      }, 'image/png')
    })
  })
  return Promise.all(promises)
}

function editor2Canvas () {
  const editor = document.getElementById('editor');
  const doc = editor.cloneNode(true);
  doc.contentEditable = false;

  const frameId = editor.getAttribute('data-frame-id');

  replaceImages(doc).then(function () {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext("2d");
    var oSerializer = new XMLSerializer();
    var sXML = oSerializer.serializeToString(doc); 

    var data = [
      "<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600'>", 
        "<foreignObject width='100%' height='100%'>",
          sXML,
        "</foreignObject>",
      "</svg>"
    ].join('')


    var blob = new window.Blob([data], {type: "image/svg+xml"});

    // var blob = BB.getBlob("image/svg+xml");
    
    //~ var dataURI = 'data:image/svg+xml;base64,' + btoa(data);

    var url = window.URL.createObjectURL(blob);
    
    var img = document.querySelector('.thumbnail[data-frame-id="' + frameId + '"]').firstChild;
    img.onload = function() {  
      window.URL.revokeObjectURL(url);  
    };  
    img.src = url || dataURI;
  })
  .catch(function (err) {
    console.error(err)
  })
  

  //~ img.src = dataURI;
  //~ editor.contentEditabe = true;
}
