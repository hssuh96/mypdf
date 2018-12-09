extractedElement = extractMainContentElement(document.body);

console.log('extracted main content element!', extractedElement);

titleText = findTitle(document.body, extractedElement);

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
    func(node);
    node = node.firstChild;
    while (node) {
        walk(node, func);
        node = node.nextSibling;
    }
};

function rawHTML(html){
  var wrapper= document.createElement('div');
wrapper.innerHTML= html;
walk_the_DOM(wrapper.firstChild, function(element) {
    //console.log(element);
    // console.log("parent"+element.parentNode);
    // if(element.tagName){console.log(element.tagName)}
    if(element.tagName =="IMG" && element.className.includes("progressiveMedia-thumbnail")){
        // console.log("지운다");
        element.remove();
    }

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


    if(element.getAttribute && element.getAttribute("role") =="toolbar"){
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
  const faStyleElement = document.createElement("link");
  faStyleElement.setAttribute("rel", "stylesheet");
  faStyleElement.setAttribute("type", "text/css");
  faStyleElement.setAttribute("href", "https://use.fontawesome.com/releases/v5.5.0/css/all.css");
  faStyleElement.setAttribute("integrity", "sha384-B4dIYHKNBt8Bc12p+WXckhzcICo0wtJAoU8YZTY5qE0Id1GSseTk6S+L3BlXeVIU");
  faStyleElement.setAttribute("crossorigin", "anonymous");
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
