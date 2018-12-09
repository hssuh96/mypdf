extractedElement = extractMainContentElement(document.body);

console.log('extracted main content element!', extractedElement);

titleElement = findTitle(document.body, extractedElement);

console.log('extracted title', titleElement);

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

var modalHTMLPath = chrome.extension.getURL('assets/modal.html');

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

  // const documentHTML = document.head.outerHTML + document.body.outerHTML;
  const documentHTML = extractedElement.outerHTML;

  const modalElement = createElementFromHTML(data);

  appendModalToDocument(modalElement);

  const modalIframeElement = modalElement.getElementsByClassName("myp-page-content-iframe")[0];
  const iframeDocument = modalIframeElement.contentWindow.document;

  iframeDocument.open();
  iframeDocument.write(documentHTML);
  iframeDocument.close();

  let selectedElement = null;

  iframeDocument.addEventListener("click", (evt) => {
    evt.preventDefault(); // to prevent link click

    removeAllClassesInElement(iframeDocument, "myp-selected-element");

    selectedElement = findNearestCommonAncestorOfTwo(selectedElement, evt.target);
    selectedElement.classList.add("myp-selected-element");
  });

  // let candidateElement;
  iframeDocument.addEventListener("mouseover", (evt) => {
    removeAllClassesInElement(iframeDocument, "myp-candidate-element");

    const candidateElement = findNearestCommonAncestorOfTwo(selectedElement, evt.target);
    candidateElement.classList.add("myp-candidate-element");
  });

  iframeDocument.addEventListener("mouseout", (evt) => {
    removeAllClassesInElement(iframeDocument, "myp-candidate-element");
  });

  document.getElementsByClassName("myp-trim-btn")[0].addEventListener("click", () => {
    iframeDocument.body.innerHTML = selectedElement.outerHTML;
  })
});
