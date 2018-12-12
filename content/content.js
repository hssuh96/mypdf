var bodyElement = document.body;
var extractedElement;
var titleText;

extractedElement = extractMainContentElement(bodyElement);

titleText = findTitle(bodyElement, extractedElement);

if (window.location.hostname === 'blog.naver.com') {
  console.log('naver blog!');
  console.log('document.getElementById("postListBody")', document.getElementById("postListBody"));
  console.log('iframe', document.getElementById("mainFrame").contentWindow.document.body);

  const naverIframeDocument = document.getElementById("mainFrame").contentWindow.document;

  console.log('WTF', naverIframeDocument.getElementById("postListBody"));

  extractedElement = naverIframeDocument.getElementById("postListBody");
  titleText = naverIframeDocument.getElementsByClassName("pcol1")[0].textContent;
}

console.log('extracted main content element!', extractedElement);


console.log('extracted title', titleText);

function addModalStyleToDocument() {
  const modalCSSPath = chrome.extension.getURL('assets/modal.css');

  const styleElement = document.createElement("link")
  styleElement.setAttribute("rel", "stylesheet")
  styleElement.setAttribute("type", "text/css")
  styleElement.setAttribute("href", modalCSSPath)
  styleElement.setAttribute("id", "myp-modal-style");

  document.head.appendChild(styleElement);
}

function createElementFromHTML(htmlString) {
  const el = document.createElement('div');
  el.innerHTML = htmlString;

  return el.firstChild;
}

function appendModalToDocument(modalElement) {
  document.body.classList.add("myp-modal-opened");
  document.body.appendChild(modalElement);
}

function findNearestCommonAncestorOfTwo(node1, node2) {
  if (!node1 || !node2) {
    return node1 || node2;
  }

  if (node1.contains(node2)) {
    return node1;
  }

  if (node2.contains(node1)) {
    return node2;
  }

  return findNearestCommonAncestorOfTwo(node1.parentNode, node2.parentNode)
}

function removeAllClassesInElement(element, className) {
  const elList = element.getElementsByClassName(className);

  for (let i = 0 ; i < elList.length ; i ++) {
    if (elList[i]) {
      elList[i].classList.remove(className);
    }
  }
}


var walk_the_DOM = function walk(node, func) {
  // console.log('first node', node);
    func(node);
    node = node.firstChild;
    while (node) {
      // console.log('node', node);
      const nextSibling = node.nextSibling;
      walk(node, func);
      node = nextSibling;
    }
};

function rawHTML(html){
  var wrapper= document.createElement('div');
wrapper.innerHTML= html;
walk_the_DOM(wrapper, function(element) {
    if (element.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    // console.log("parent"+element.parentNode);
    // if(element.tagName){console.log(element.tagName)}
    if(element.tagName == "IMG" && element.className.includes("progressiveMedia-thumbnail")){
        // console.log("지운다");
        element.remove();
        return;
    }
    
    if (element.tagName === 'IMG' && !element.getAttribute("src") && element.getAttribute("data-src")) {
      element.setAttribute("src", element.getAttribute("data-src"));
    }

    if (element.tagName === 'BUTTON') {
      element.remove();
      return;
    }

    if (element.tagName === 'IFRAME') {
      element.remove();
      return;
    }

    if (element.tagName === 'SCRIPT') {
      element.remove();
      return;
    }

    // element.classList.forEach((className) => {
    //   if (className.toLowerCase().includes("comment")) {
    //     element.remove();
    //     return;
    //   }
    // })

    // if(element.parentNode.tagName == "EM"){
    //     if(element.nodeType== Node.TEXT_NODE){console.log("EM들어옴"+element.textContent);}

    //     if(element.previousSibling && element.tagName == "SPAN" && element.previousSibling.nodeType== Node.TEXT_NODE){
    //         console.log("element"+element);
    //         console.log("element.previousSibling"+element.previousSibling)
    //         element.previousSibling.textContent += element.innerHTML;
    //         element.parentNode.removeChild(element);
    //     }else if(element.previousSibling && element.previousSibling.nodeType== Node.TEXT_NODE && element.nodeType== Node.TEXT_NODE){
    //         element.previousSibling.textContent += element.textContent;
    //     }
    // }


    if(element.getAttribute && element.getAttribute("role") === "toolbar"){
        element.remove();
    }
    if(element.tagName && element.tagName === "FOOTER"){
      console.log('element', element);
        element.remove();
    }

    if(element.removeAttribute) {
        element.removeAttribute('id');
        element.removeAttribute('style');
        element.removeAttribute('class');
        // if(element.getBoundingClientRect().width*element.getBoundingClientRect().height ==0){
        //     if(element.getElementsByTagName == "img"){
        //         console.log("이미지닼"+element.outerHTML);
        //     }
        //     element.removeAttribute("src");
        // }

    }
    //console.log(element.outerHTML);
});

  result = wrapper.innerHTML;
  return result
}


var modalHTMLPath = chrome.extension.getURL('assets/modal.html');

// fetch(contentCSSPath)
// .then(response => response.text())
// .then(data => {
//   console.log('css', data);
// })

fetch(modalHTMLPath)
.then(response => response.text())
.then(data => {
  const faCSSPath = chrome.extension.getURL('assets/all.min.css');
  const faStyleElement = document.createElement("link");
  faStyleElement.setAttribute("rel", "stylesheet");
  faStyleElement.setAttribute("type", "text/css");
  faStyleElement.setAttribute("href", faCSSPath);
  document.head.appendChild(faStyleElement);

  if (document.getElementById("myp-modal")) {
    document.getElementById("myp-modal").remove();
  }

  if (document.getElementById("myp-modal-style")) {
    document.getElementById("myp-modal-style").remove();
  }

  addModalStyleToDocument();

  const contentCSSPath = chrome.extension.getURL('assets/content.css');

  const contentCSSstyleElement = document.createElement("link");
  contentCSSstyleElement.setAttribute("rel", "stylesheet");
  contentCSSstyleElement.setAttribute("type", "text/css");
  contentCSSstyleElement.setAttribute("href", contentCSSPath);

  // const documentHTML = document.head.outerHTML + document.body.outerHTML;
  const documentHTML = '<head>' + contentCSSstyleElement.outerHTML + '</head>' + '<body>' + rawHTML('<h1>' + titleText + '</h1>' + extractedElement.outerHTML + '</body>');

  const modalElement = createElementFromHTML(data);

  appendModalToDocument(modalElement);

  const modalIframeElement = modalElement.getElementsByClassName("myp-page-content-iframe")[0];
  const iframeDocument = modalIframeElement.contentWindow.document;

  // iframeDocument.open();
  // iframeDocument.write(documentHTML);
  // iframeDocument.close();

  let isEraseActivated = false;

  document.getElementById("myp-erase-btn").addEventListener("click", () => {
    isEraseActivated = !isEraseActivated;

    if (isEraseActivated) {
      document.getElementById("myp-erase-btn").classList.add("active");
    } else {
      document.getElementById("myp-erase-btn").classList.remove("active");
    }
  });

  document.getElementById("myp-print-btn").addEventListener("click", () => {
    const printFrm = modalIframeElement.contentWindow;
    printFrm.focus();
    printFrm.print();
  });

  document.getElementById("myp-close-btn").addEventListener("click", () => {
    document.getElementById("myp-modal").remove();
    document.body.classList.remove("myp-modal-opened");
  });

  document.getElementById("myp-image-size-select").addEventListener("change", (evt) => {
    if (document.getElementById("myp-style-for-image-size")) {
      document.getElementById("myp-style-for-image-size").remove();
    }

    const imageSizeStyleElement = document.createElement("style");
    imageSizeStyleElement.setAttribute("id", "myp-style-for-image-size");
    imageSizeStyleElement.innerHTML = `img{max-width:${evt.target.value};}`

    iframeDocument.head.appendChild(imageSizeStyleElement);
  });

  document.getElementById("myp-fullscreen-btn").addEventListener("click", (evt) => {
    if (document.getElementById("myp-style-for-fullscreen")) {
      document.getElementById("myp-style-for-fullscreen").remove();
      const i = evt.target.childNodes[0];
      const textNode = evt.target.childNodes[1];

      if (i && textNode) {
        i.setAttribute("class", "fas fa-expand-arrows-alt")
        textNode.data = ' 크게보기';
      }
    } else {
      const imageSizeStyleElement = document.createElement("style");
      imageSizeStyleElement.setAttribute("id", "myp-style-for-fullscreen");
      imageSizeStyleElement.innerHTML = '.myp-modal {height:100vh !important; padding:0 !important;} .myp-grey-background {background-color: grey !important; opacity: 1 !important;}';

      document.head.appendChild(imageSizeStyleElement);

      const i = evt.target.childNodes[0];
      const textNode = evt.target.childNodes[1];

      if (i && textNode) {
        i.setAttribute("class", "fas fa-compress")
        textNode.data = ' 작게보기';
      }
    }
  });

  const undoList = [];

  const setUndoDisplay = function() {
    if (undoList.length > 0) {
      document.getElementById("myp-undo-btn").classList.remove("hide");
    } else {
      document.getElementById("myp-undo-btn").classList.add("hide");
    }
  }

  const initializeIframeDocument = function(htmlString) {
    iframeDocument.open();
    iframeDocument.write(htmlString);
    iframeDocument.close();

    iframeDocument.addEventListener("click", (evt) => {
      evt.preventDefault(); // to prevent link click

      if (isEraseActivated) {
        if (evt.target) {
          undoList.push(iframeDocument.documentElement.outerHTML);
          setUndoDisplay();
          evt.target.remove();
        }
      }
    });

    iframeDocument.addEventListener("mouseover", (evt) => {
      removeAllClassesInElement(iframeDocument, "myp-remove-candidate-element");
      if (isEraseActivated) {
        if (evt.target) {
          evt.target.classList.add("myp-remove-candidate-element");
        }
      }
    });

    iframeDocument.addEventListener("mouseout", (evt) => {
      removeAllClassesInElement(iframeDocument, "myp-remove-candidate-element");
    });
  };

  initializeIframeDocument(documentHTML);

  document.getElementById("myp-undo-btn").addEventListener("click", () => {
    if (undoList.length > 0) {
      const lastHTML = undoList.pop();
      setUndoDisplay();
      initializeIframeDocument(lastHTML);
    }
  });

  setUndoDisplay();
});
