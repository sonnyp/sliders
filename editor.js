(function (window, document) {
  'use strict';

  const template = `
    <h1>title</h1>
    <img src="tux.png" style="width: 60px;"/>
    <ol>
      <li>ordered list</li>
      <li>ordered list</li>
    </ol>
    <ul>
      <li>unordered list</li>
      <li>unordered list</li>
    </ul>
    <a href="http://wikipedia.org">a link</a>
    <p><strong>hello</strong> dear <cite>world</cite></p>
  `

  const frames = []

  window.URL = window.URL || window.webkitURL

  const editor = document.getElementById('editor')

  // fullscreen preview
  const prefix = ['moz', 'webkit'].find((prefix) => {
    return editor[prefix + 'RequestFullScreen']
  })
  function preview () {
    editor.contentEditable = false
    editor[prefix + 'RequestFullScreen']()
  }
  document.addEventListener(prefix + 'fullscreenchange', () => {
    if (
      !document[`${prefix}FullScreenEnabled`] ||
      document[`${prefix}FullScreenElement`] !== editor) {
      editor.contentEditable = true;
    }
  });
  document.getElementById('preview').addEventListener('click', preview)

  function fullscreen () {
    document.body[prefix + 'RequestFullScreen']()
  }
  document.getElementById('fullscreen').addEventListener('click', fullscreen)

  const Editor = {
    newFrame: function() {
      const id = frames.length;
      const frame = {
        content: template
      };
      frames.push(frame);
      UI.addThumbnail(id);
      UI.switchToFrame(id);
      // editor2Canvas();
    },
  }

  const UI = {
    editor,
    addThumbnail: function(aFrameId) {
      const li = document.createElement('li');
      li.addEventListener('click', function() {
        const frameId = this.getAttribute('data-frame-id');
        UI.switchToFrame(frameId);
      });
      li.classList.add('thumbnail');
      li.setAttribute('data-frame-id', aFrameId);
      const img = document.createElement('img');
      img.src = "white.png"
      li.appendChild(img);
      const thumbnails = document.getElementById('thumbnails');
      thumbnails.insertBefore(li, document.getElementById('newFrame'));
    },
    switchToFrame: function(aFrameId) {
      editor.innerHTML = frames[aFrameId].content;
      editor.setAttribute('data-frame-id',  aFrameId);
      const thumbnails = document.querySelectorAll('.thumbnail');
      const thumbnail = document.querySelector('.thumbnail[data-frame-id="' + aFrameId + '"]');
      for (let i = 0; i < thumbnails.length; i++) {
        thumbnails[i].classList.remove('active');
      }
      thumbnail.classList.add('active');
    }
  }

  //Editor stuff
  const observer = new window.MutationObserver(mutations => {
    const muts = mutations.filter(mut => {
      return mut.type !== 'attributes' || mut.attributeName !== '_moz_resizing'
    })

    editor2Canvas();
    const frameId = editor.getAttribute('data-frame-id');
    frames[frameId].content = editor.innerHTML;
  });
  observer.observe(editor, {
    childList: true,
    attributes: true,
    characterData: true,
    subtree: true,
    attributeOldValue: true,
    characterDataOldValue: true,
  });
  

  //newFrame
  const newPageButton = document.getElementById('newFrame');
  newPageButton.addEventListener('click', function() {
    Editor.newFrame();
  });

  function promiseLoaded (img) {
    return new Promise((resolve, reject) => {
      if (img.complete) {
        resolve()
      } else {
        img.addEventListener('load', resolve)
      }
    })
  }

  /*
   * Make imgs "screenshot-able"
   * SVG foreignObject doesn't allow external resources even from the same origin
   * https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Drawing_DOM_objects_into_a_canvas#Security
   * so we replace their src properties with the blob url equivalent
   */
  function replaceImages (doc) {
    const imgs = [...doc.querySelectorAll('img')]
    return Promise.all(imgs.map(img => {
      return promiseLoaded(img).then(() => {
        return new Promise((resolve) => {
          img.removeAttribute('_moz_resizing');
          const canvas = document.createElement('canvas')
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, img.width, img.height);

          // works in Chrome and Firefox
          img.src = canvas.toDataURL('image/png')
          resolve()
          // works in Firefox but not Chrome
          // canvas.toBlob(blob => {
          //   img.addEventListener('load', function () {
          //     window.URL.revokeObjectURL(blob)
          //   })
          //   img.src = window.URL.createObjectURL(blob)
          //   resolve()
          // }, 'image/png')
        })
      })
    }))
  }

  function editor2Canvas () {
    const editor = document.getElementById('editor');
    const doc = editor.cloneNode(true);
    doc.contentEditable = false;

    const frameId = editor.getAttribute('data-frame-id');
    replaceImages(doc).then(function () {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext("2d");
      const sXML = (new XMLSerializer()).serializeToString(doc)
      const data = `
        <svg xmlns='http://www.w3.org/2000/svg' width='600' height='600'> 
          <foreignObject width='100%' height='100%'>
            ${sXML}
          </foreignObject>,
        </svg>
      `

      const blob = new window.Blob([data], {type: "image/svg+xml"});
      const url = window.URL.createObjectURL(blob);
      
      const img = document.querySelector('.thumbnail[data-frame-id="' + frameId + '"]').firstChild;
      img.addEventListener('load', () => window.URL.revokeObjectURL(url))
      img.src = url;
    })
    .catch(function (err) {
      console.error(err)
    })
  }
}(this, this.document))
