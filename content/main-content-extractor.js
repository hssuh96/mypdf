console.log('main-content-extractor injected!');

var generalCompositeCondition = {
  compositeType: "commonAncestor",
  conditions: [
    {
      type: "tag",
      value: "article"
    },
    {
      type: "id",
      value: "article"
    },
    {
      type: "class",
      value: "article"
    },
    {
      type: "tag",
      value: "main"
    },
    {
      type: "id",
      value: "main"
    },
    {
      type: "class",
      value: "main"
    },
    {
      type: "id",
      value: "content"
    },
    {
      type: "class",
      value: "content"
    },
  ]
}

var websiteSpecificCompositeConditions = {
  "news.naver.com": {
    compositeType: "firstMatch",
    conditions: [
      {
        type: "id",
        value: "articleBodyContents",
      },
    ]
  }
}

var sideBarCompositeCondition = {
  compositeType: "firstMatch",
  conditions: [
    {
      type: "id",
      value: "sidebar"
    },
    {
      type: "class",
      value: "sidebar"
    },
    {
      type: "tag",
      value: "nav"
    },
  ]
}

function extractMainContentElement(bodyElement) {
  // website specific condition에 의해 얻은 것은 바로 return
  const websiteSpecificCompositeCondition = websiteSpecificCompositeConditions[window.location.hostname];

  if (websiteSpecificCompositeCondition) {
    const elementByWebsiteSpecificConditions = findElementByCompositeCondition(bodyElement, websiteSpecificCompositeCondition);

    if (elementByWebsiteSpecificConditions) {
      return elementByWebsiteSpecificConditions;
    }
  }

  // general condition에 의해 찾은 것은 몇 단계 필터링 단계를 더 거침.
  const elementByGeneralConditions = findElementByCompositeCondition(bodyElement, generalCompositeCondition);

  let objectiveElement = elementByGeneralConditions ? elementByGeneralConditions : bodyElement;
  // const objectiveElement = bodyElement;


  console.log('objectiveElement', objectiveElement);

  // find sideBar
  const sideBarElementByConditions = findElementByCompositeCondition(objectiveElement, sideBarCompositeCondition);

  if (sideBarElementByConditions) {
    console.log('sideBar', sideBarElementByConditions);

    const estimatedMainContentElementByExcludingSidebar = findMainContentByExcludingSideBar(objectiveElement, sideBarElementByConditions);

    if (estimatedMainContentElementByExcludingSidebar) {
      return estimatedMainContentElementByExcludingSidebar;
    }
  }

  // find comment area
  // const commentArea = findCommentArea(objectiveElement);
  //
  // console.log('commentArea', commentArea);
  //
  // if (commentArea) {
  //   const foo = findMainContentByExcludingSideBar(objectiveElement, commentArea);
  //
  //   console.log('foo', foo);
  //
  //   if (foo) {
  //     return foo;
  //   }
  // }

  const estimatedMainContent = findEstimatedMainContent(objectiveElement);

  return estimatedMainContent;
}

function findTitle(bodyElement, mainContentElement) {
  const hTagElements = ["h1", "h2", "h3", "h4", "h5", "h6"].reduce((acc, val) => {
    const elements = bodyElement.getElementsByTagName(val);
    const elList = []
    for (let i = 0 ; i < elements.length ; i++) {
      elList.push(elements[i]);
    }

    return acc.concat(elList);
  }, []);

  const mainContentElementDOMRect = mainContentElement.getBoundingClientRect();

  let hTagElementsInfo = hTagElements.map((el) => {
    const fontSize = window.getComputedStyle(el).fontSize;
    const isInsideMainContentElement = mainContentElement.contains(el);

    const elDOMRect = el.getBoundingClientRect();

    const distanceBetweenMainContent = Math.min(Math.abs(mainContentElementDOMRect.top - elDOMRect.bottom), Math.abs(mainContentElementDOMRect.top - elDOMRect.top));

    const area = elDOMRect.width * elDOMRect.height;

    return {
      'elementRef': el,
      'fontSize': parseInt(fontSize),
      'isInsideMainContentElement': isInsideMainContentElement,
      'distanceBetweenMainContent': distanceBetweenMainContent,
      'score': (parseInt(fontSize) * parseInt(fontSize) - distanceBetweenMainContent),
      'belowMainContent': ((elDOMRect.top - mainContentElementDOMRect.bottom) > 0),
      'area': area,
      'elDOMRect': elDOMRect,
      'mainContentElementDOMRect': mainContentElementDOMRect
    };
  });

  if (hTagElementsInfo.length === 0) {
    return null;
  }

  console.log('hTagElementsInfo before', hTagElementsInfo);

  // hTagElementsInfo.sort((a, b) => a.fontSize - b.fontSize).reverse();

  hTagElementsInfo = hTagElementsInfo.filter((x) => x.belowMainContent === false && x.area > 0);

  hTagElementsInfo.sort((a, b) => a.score - b.score).reverse();

  console.log('hTagElementsInfo after', hTagElementsInfo);

  return hTagElementsInfo[0].elementRef.textContent;
}

function findEstimatedMainContent(objectiveElement) {
  let loopCount = 0;
  while (objectiveElement && loopCount < 1000) {
    loopCount += 1;

    if (objectiveElement.nodeType === Node.ELEMENT_NODE) {
      const childNodes = objectiveElement.childNodes;
      // console.log('childNodes', childNodes);

      const elList = [];
      for (let i = 0 ; i < childNodes.length ; i++) {
        if (childNodes[i].nodeType === Node.ELEMENT_NODE) {
          elList.push(childNodes[i]);
        }
      }

      const scoreSortedElList = sortElementByScore(elList);

      console.log('scoreSortedElList', scoreSortedElList);

      if (scoreSortedElList.length > 0) {
        if (scoreSortedElList[0].score < 0.5) {
          return objectiveElement;
        }

        objectiveElement = scoreSortedElList[0].elementRef;
      } else {
        return objectiveElement;
      }

      console.log('======================')
    }
  }

  return objectiveElement;
}

// function findCommentArea(objectiveElement) {
//   const commentElementList = [];
//   walkTheDOM(objectiveElement, (el) => {
//     el.classList.forEach((className) => {
//       if (className.toLowerCase().includes("comment")) {
//         commentElementList.push(el);
//       }
//     })
//   })
//
//   return findNearestCommonAncestor(commentElementList);
// }
//
// function walkTheDOM(node, func) {
//   if (node.nodeType !== Node.ELEMENT_NODE) {
//     return;
//   }
//
//   func(node);
//   node = node.firstChild;
//   while (node) {
//     const nextSibling = node.nextSibling;
//     walkTheDOM(node, func);
//     node = nextSibling;
//   }
// };

function findMainContentByExcludingSideBar(objectiveElement, estimatedSideBarElement) {
  const pathFromAncestorToDescendant = findPathFromAncestorToDescendant(objectiveElement, estimatedSideBarElement);
  // console.log('pathFromAncestorToDescendant', pathFromAncestorToDescendant);

  for (let i = 0 ; i < pathFromAncestorToDescendant.length - 1 ; i++) {
    const parentNode = pathFromAncestorToDescendant[i];
    const objectiveChildNode = pathFromAncestorToDescendant[i + 1];
    const childNodes = parentNode.childNodes;

    console.log('parentNode', parentNode);

    const elList = [];
    for (let j = 0 ; j < childNodes.length ; j++) {
      if (childNodes[j].nodeType === Node.ELEMENT_NODE) {
        elList.push(childNodes[j]);
      }
    }

    const scoreSortedElList = sortElementByScore(elList);
    const mainContentCandidate = scoreSortedElList[0].elementRef;

    if (mainContentCandidate !== objectiveChildNode) { // sidebar와 분기가 일어난 시점
      const isMainContentNoHorizontalOverlap = elList.every((el) => {
        if (el === mainContentCandidate) {
          return true;
        }

        const horizontalOverlapRatio = getHorizontalOverlapRatio(mainContentCandidate, el);
        console.log('horizontalOverlapRatio', horizontalOverlapRatio);

        return (horizontalOverlapRatio < 0.1)
      });

      if (isMainContentNoHorizontalOverlap) {
        return mainContentCandidate;
      }

      console.log('isMainContentNoHorizontalOverlap', isMainContentNoHorizontalOverlap);
    }

    console.log('=============================');
  }

  return null; // default null
}

function getHorizontalOverlapRatio(element1, element2) {
  const elDOMRect1 = element1.getBoundingClientRect();
  const elDOMRect2 = element2.getBoundingClientRect();

  const overlapDistance = Math.max(0, Math.min(elDOMRect1.x + elDOMRect1.width, elDOMRect2.x + elDOMRect2.width) - Math.max(elDOMRect1.x, elDOMRect2.x));

  const maxWidth = Math.max(elDOMRect1.width, elDOMRect2.width);

  return overlapDistance / maxWidth;
}

function getHighestScoreElement(elList) {
  let highestScore = 0;
  let highestScoreElement = null;
  for (let i = 0 ; i < elList.length ; i++) {
    const score = getTotalScore(elList[i]);
    if (score > highestScore) {
      highestScore = score;
      highestScoreElement = elList[i];
    }
  }

  return highestScoreElement;
}

function sortElementByScore(elList) {
  const elListWithScore = [];
  for (let i = 0 ; i < elList.length ; i++) {
    if (elList[i].nodeType === Node.ELEMENT_NODE) {
      elListWithScore.push({
        'elementRef': elList[i],
        // 'score': getTotalScore(elList[i]),
        'score': getElementWordCountScoreV2(elList[i]),
        // 'areaScore': getElementAreaScore(elList[i]),
        // 'wordList': getWordList(elList[i]),
        // 'wordListFiltered': getWordList(elList[i]).filter((str) => countWords(str) > 3),
        // 'wordCountListFiltered': getWordList(elList[i]).filter((str) => countWords(str) > 3).map((str) => countWords(str)),
        // 'wordScoreV1': getWordList(elList[i]).map((str) => countWords(str)).filter((count) => count > 3).reduce((acc, val) => acc + val, 0),
        // 'wordScoreV2': getElementWordCountScoreV2(elList[i])
      })
    }
  }

  elListWithScore.sort((a, b) => (a.score - b.score)).reverse();

  return elListWithScore;
}

function getElementWordCountScoreV2(element) {
  const parentNode = element.parentNode;

  if (document.body.contains(parentNode)) {
    const childNodes = parentNode.childNodes;
    const childNodesScoreList = [];
    for (let i = 0 ; i < childNodes.length ; i++) {
      const score = getWordList(childNodes[i]).map((str) => countWords(str)).filter((count) => count > 3).reduce((acc, val) => acc + val * Math.min(val, 40), 0);
      childNodesScoreList.push(score)
    }

    const totalScoreOfSiblingsIncludeMe = childNodesScoreList.reduce((acc, val) => acc + val, 0);

    const myScore = getWordList(element).map((str) => countWords(str)).filter((count) => count > 3).reduce((acc, val) => acc + val * Math.min(val, 40), 0);

    if (totalScoreOfSiblingsIncludeMe === 0) {
      return 1;
    }

    return myScore / totalScoreOfSiblingsIncludeMe;
  } else {
    return 1;
  }

  // return getWordList(element).map((str) => countWords(str)).filter((count) => count > 3).reduce((acc, val) => acc + val * val, 0)
}

function getTotalScore(element) {
  return (getElementAreaScore(element) + 2 * getElementWordCountScore(element)) / 3;
}

function getElementAreaScore(element) { // 0 ~ 1
  const elDOMRect = element.getBoundingClientRect();
  const bodyDOMRect = document.body.getBoundingClientRect();

  if (bodyDOMRect.width === 0 || bodyDOMRect.height === 0) {
    return 1;
  }

  const areaRatio = (elDOMRect.width * elDOMRect.height) / (bodyDOMRect.width * bodyDOMRect.height);

  return Math.min(areaRatio, 1);
}

function getElementWordCountScore(element) { // 0 ~ 1
  const wordCountList = getWordCountList(element);

  const countMoreThan10Words = wordCountList.filter((x) => x > 10).length

  return Math.min(countMoreThan10Words, 20) / 20;
}

function getWordCountList(node) {
  let wordCountList = []; // word count가 0인 것은 넣지 않음

  if (node.nodeType === Node.ELEMENT_NODE) {
    node = node.firstChild;
    while (node) {
      wordCountList = wordCountList.concat(getWordCountList(node))
      node = node.nextSibling;
    }
  } else if (node.nodeType === Node.TEXT_NODE) {
    const text = node.wholeText;
    if (text.length > 0) {
      const wordCount = countWords(text);
      if (wordCount > 0) {
        wordCountList.push(wordCount);
      }
    }
  }

  return wordCountList;
}

function getWordList(node) {
  let wordList = []; // word count가 0인 것은 넣지 않음

  if (node.nodeType === Node.ELEMENT_NODE) {
    if (node.tagName === 'SCRIPT' || node.tagName === 'NOSCRIPT') {
      return wordList;
    }

    const classList = node.classList;

    for (let i = 0 ; i < classList.length ; i++) {
      if (classList[i].toLowerCase().includes("comment")) {
        return wordList;
      }
    }

    node = node.firstChild;
    while (node) {
      if (isTextNodeOrPhraseTagsOrSpan(node) && node.previousSibling &&
      isTextNodeOrPhraseTagsOrSpan(node.previousSibling)) {
        const wordListOfTextNode = getWordList(node);
        if (wordList.length > 0 && wordListOfTextNode.length === 1) {
          wordList[wordList.length - 1] += wordListOfTextNode[0];
          node = node.nextSibling;
          continue;
        }
      }

      wordList = wordList.concat(getWordList(node))

      node = node.nextSibling;
    }
  } else if (node.nodeType === Node.TEXT_NODE) {
    if (document.body.contains(node.parentNode) && node.parentNode.nodeType === Node.ELEMENT_NODE) {
      const nodeBoundingRect = node.parentNode.getBoundingClientRect();
      if (nodeBoundingRect.width * nodeBoundingRect.height === 0) {
        return wordList;
      }
    }

    const text = node.wholeText;
    if (text.length > 0) {
      if (countWords(text) > 0) {
        wordList.push(text);
      }
    }
  }

  return wordList;
}

function isTextNodeOrPhraseTagsOrSpan(node) {
  const styleTagsList = [
    "SPAN",
    "EM",
    "STRONG",
    "MARK",
    "ABBR",
    "ACRONYM",
    "CODE",
    "B",
    "I",
    "U",
    "STRIKE",
    "TT",
    "SUP",
    "SUB",
    "INS",
    "DEL",
    "BIG",
    "SMALL",
    "FONT",
    "A"
  ]

  if (node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return true;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (styleTagsList.includes(node.tagName)) {
        const childNodes = node.childNodes;

        if (childNodes.length === 1) {
          return isTextNodeOrPhraseTagsOrSpan(childNodes[0]);
        }
      }
    }
  }

  return false;
}

function countWords(s){
  s = s.replace(/(^\s*)|(\s*$)/gi,""); // exclude start and end white-space
  s = s.replace(/[\n\t]+/gi," "); // replace newline and tab with a space
  s = s.replace(/[ ]{2,}/gi," "); // 2 or more space to 1
  return s.split(' ').filter(function(str){return str!="";}).length;
}

function findPathFromAncestorToDescendant(ancestorNode, descendantNode) {
  const pathFromDescendantToAncestor = [];
  let el = descendantNode;
  while (el && ancestorNode.contains(el)) {
    pathFromDescendantToAncestor.push(el);
    el = el.parentNode;
  }

  return pathFromDescendantToAncestor.reverse();
}

function findElementByCompositeCondition(bodyElement, compositeCondition) {
  switch (compositeCondition.compositeType) {
    case 'firstMatch':
      return findElementByCompositeConditionFirstMatch(bodyElement, compositeCondition);
    case 'commonAncestor':
      return findElementByCompositeConditionCommonAncestor(bodyElement, compositeCondition);
    default: {
      console.error('invalid compositeType');
      return null;
    }
  }
}

function findElementByCompositeConditionFirstMatch(bodyElement, compositeCondition) {
  for (let i = 0 ; i < compositeCondition.conditions.length ; i++) {
    const el = findElementByCondition(bodyElement, compositeCondition.conditions[i]);
    if (el) {
      return el
    }
  }

  return null; // default null
}

function findElementByCompositeConditionCommonAncestor(bodyElement, compositeCondition) {
  const elList = [];
  for (let i = 0 ; i < compositeCondition.conditions.length ; i++) {
    const el = findElementByCondition(bodyElement, compositeCondition.conditions[i]);
    if (el) {
      elList.push(el)
    }
  }

  if (elList.length > 0) {
    return findNearestCommonAncestor(elList);
  }

  return null
}

function findElementByCondition(bodyElement, condition) {
  switch (condition.type) {
    case "id": {
      const el = document.getElementById(condition.value)
      if (el && bodyElement.contains(el)) { // bodyElement 안에 있을 때만 return
        return el;
      }
      break;
    }
    case "class": {
      const elList = bodyElement.getElementsByClassName(condition.value);
      if (elList.length > 0) {
        return findNearestCommonAncestor(elList); // 여러 개가 있을 경우 가장 가까운 공통 조상 리턴
      }
      break;
    }
    case "tag": {
      const elList = bodyElement.getElementsByTagName(condition.value);
      if (elList.length > 0) {
        return findNearestCommonAncestor(elList);
      }
      break;
    }
    default: {
      break;
    }
  }

  return null
}

function findNearestCommonAncestor(nodeList) {
  if (nodeList.length === 0) {
    return null;
  }

  let nearestCommonAncestor = nodeList[0]
  for (let i = 1 ; i < nodeList.length ; i++) {
    nearestCommonAncestor = findNearestCommonAncestorOfTwo(nearestCommonAncestor, nodeList[i])
  }

  return nearestCommonAncestor;
}

function findNearestCommonAncestorOfTwo(node1, node2) {
  if (!node1 || !node2) {
    return null
  }

  if (node1.contains(node2)) {
    return node1;
  }

  if (node2.contains(node1)) {
    return node2;
  }

  return findNearestCommonAncestorOfTwo(node1.parentNode, node2.parentNode)
}
