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
  const modalCloseBtn = modalElement.getElementsByClassName("myp-close-btn")[0];

  modalCloseBtn.addEventListener("click", () => {
    document.getElementById("myp-modal").remove();
    document.body.classList.remove("myp-modal-opened");
  });

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

  iframeDocument.open();
  iframeDocument.write(documentHTML);
  iframeDocument.close();

  const modalCSSPath = chrome.extension.getURL('assets/modal.css');

  const modalStyleElement = document.createElement("link")
  modalStyleElement.setAttribute("rel", "stylesheet")
  modalStyleElement.setAttribute("type", "text/css")
  modalStyleElement.setAttribute("href", modalCSSPath)
  modalStyleElement.setAttribute("id", "myp-modal-style");

  iframeDocument.head.appendChild(modalStyleElement);

  iframeDocument.addEventListener("click", (evt) => {
    evt.preventDefault(); // to prevent link click

    if (evt.target) {
      evt.target.remove();
    }
  });

  iframeDocument.addEventListener("mouseover", (evt) => {
    removeAllClassesInElement(iframeDocument, "myp-remove-candidate-element");
    if (evt.target) {
      evt.target.classList.add("myp-remove-candidate-element");
    }
  });

  iframeDocument.addEventListener("mouseout", (evt) => {
    removeAllClassesInElement(iframeDocument, "myp-remove-candidate-element");
  });
});
