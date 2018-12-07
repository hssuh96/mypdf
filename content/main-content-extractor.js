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

  const objectiveElement = elementByGeneralConditions ? elementByGeneralConditions : bodyElement;

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

  console.log('필터링 하나도 안 먹힘')

  return objectiveElement;
}

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

    const mainContentCandidate = getHighestScoreElement(elList);
    console.log('mainContentCandidate', mainContentCandidate);

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

function getTotalScore(element) {
  return (getElementAreaScore(element) + 2 * getElementWordCountScore(element)) / 3;
}

function getElementAreaScore(element) { // 0 ~ 1
  const elDOMRect = element.getBoundingClientRect();
  const bodyDOMRect = document.body.getBoundingClientRect();

  if (elDOMRect.width > bodyDOMRect.width || elDOMRect.height > bodyDOMRect.height) {
    return 1;
  }

  if (bodyDOMRect.width === 0 || bodyDOMRect.height === 0) {
    return 1;
  }

  return (elDOMRect.width * elDOMRect.height) / (bodyDOMRect.width * bodyDOMRect.height);
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
