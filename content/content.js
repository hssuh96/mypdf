extractedElement = extractMainContentElement(document.body);

console.log('extracted main content element!', extractedElement);

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

  const documentHTML = document.head.outerHTML + document.body.outerHTML;

  const modalElement = createElementFromHTML(data);

  appendModalToDocument(modalElement);

  const modalIframeElement = modalElement.getElementsByClassName("myp-page-content-iframe")[0];
  const iframeDocument = modalIframeElement.contentWindow.document;

  iframeDocument.open();
  iframeDocument.write(documentHTML);
  iframeDocument.close();

  let selectedElement = null;

  var foo;
  iframeDocument.addEventListener("click", (evt) => {
    console.log('iframe click!');
    evt.preventDefault(); // to prevent link click

    console.log('target', evt.target);
    removeAllClassesInElement(iframeDocument, "myp-selected-element");

    // if (foo) {
    //   foo.remove();
    // }

    selectedElement = findNearestCommonAncestorOfTwo(selectedElement, evt.target);
    selectedElement.classList.add("myp-selected-element");

    // foo = document.createElement("div");
    // foo.classList.add("myp-selected-element-div");
    // selectedElement.appendChild(foo);
    // console.log('added foo', selectedElement);
  });

  var bar;
  // let candidateElement;
  iframeDocument.addEventListener("mouseover", (evt) => {
    console.log('mouseover', evt.target);
    // removeAllClassesInElement(iframeDocument, "myp-mouseover");
    removeAllClassesInElement(iframeDocument, "myp-candidate-element");

    // let mouseoverElement = evt.target;
    // if (mouseoverElement.nodeType === Node.ELEMENT_NODE
    //   && mouseoverElement.classList.contains("myp-candidate-element-div")) {
    //   mouseoverElement = mouseoverElement.parentNode;
    // }

    // evt.target.classList.add("myp-mouseover");
    const candidateElement = findNearestCommonAncestorOfTwo(selectedElement, evt.target);
    candidateElement.classList.add("myp-candidate-element");

    // console.log('candidateElement', candidateElement);
    // console.log('newCandidateElement', newCandidateElement);
    // if (candidateElement !== newCandidateElement) {
    //   console.log('different!');
    //   if (bar) {
    //     bar.remove();
    //   }
    //
    //   candidateElement = newCandidateElement;
    //
    //   bar = document.createElement("div");
    //   bar.classList.add("myp-candidate-element-div");
    //   candidateElement.appendChild(bar);
    // }
  });

  iframeDocument.addEventListener("mouseout", (evt) => {
    removeAllClassesInElement(iframeDocument, "myp-candidate-element");
  });

  document.getElementsByClassName("myp-trim-btn")[0].addEventListener("click", () => {
    console.log('trim');

    iframeDocument.body.innerHTML = selectedElement.outerHTML;
  })
});
