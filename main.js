async function getAndParseData(url) {
  //GET DATA
  const response = await fetch(url);
  const data = await response.text();
  //Split every row of the data
  const arrOfEveryRowToString = data.split(/\r?\n/);
  const delimiter = findDelimiter(data);
  //Save  the first row into separate variable cause that will be our main properties
  const keyProperties = arrOfEveryRowToString.shift().split(delimiter);
  const parsedCsvToJson = arrOfEveryRowToString.reduce((result, element) => {
    //Split the row into array of values
    const arrayOfValues = element.split(delimiter);
    //Check for empty lines
    if (
      arrayOfValues.join("").trim() !== "" &&
      arrayOfValues.length !== 1 &&
      arrayOfValues[0].length !== 0
    ) {
      //Match and save corresponding key/value pairs for every row of the data
      const parsedRowToObject = {};
      for (let i = 0; i < keyProperties.length; i++) {
        parsedRowToObject[keyProperties[i]] = arrayOfValues[i];
      }
      result.push(parsedRowToObject);
    }
    return result;
  }, []);
  return parsedCsvToJson;
}
//Check which of the possible delimiters splits the data into longest array
findDelimiter = (data) => {
  const possibleDelimiters = [",", ";", "|"];
  const delimiter = possibleDelimiters.reduce(
    (value, current) => {
      const val = data.split(current).length;
      if (val > value.lengthAfterSplit) {
        return (value = { delim: current, lengthAfterSplit: val });
      } else {
        return value;
      }
    },
    { delim: "", lengthAfterSplit: 0 }
  );
  return delimiter.delim;
};

reArrangeItems = (navMenu) => {
  let currentEl;
  let parrentEl;
  // Sort array so most nested items go last, and the main items come first.
  navMenu.sort((a, b) =>
    a.ParentID === "NULL" ? -1 : Number(a.ParentID < Number(b.ParentID) ? 0 : 1)
  );
  // Loop through the array starting from the back, so the most nested elements gets executed first
  //and index won't mess up when element is cut from their place, and put into their parents object.
  for (let index = navMenu.length - 1; index >= 0; index--) {
    const element = navMenu[index];
    const parentIndex = navMenu.findIndex((el) => el.ID === element.ParentID);
    if (parentIndex !== -1) {
      currentEl = navMenu.splice(index, 1);
      parrentEl = navMenu[parentIndex];
      navMenu[parentIndex] = {
        ...parrentEl,
        nested: parrentEl.nested
          ? [...parrentEl.nested, currentEl[0]]
          : [[...currentEl][0]],
      };
    }
  }
  return navMenu;
};
const createNavMenu = (elements, depthLevel) => {
  //sort elements alphabetically then map
  const NavigationMenu = elements
    .sort((a, b) => a.MenuName.localeCompare(b.MenuName))
    .map((singleNavItem) => {
      const { MenuName, isHidden, LinkURL, nested } = singleNavItem;
      const indentation = "...";
      const isHiddenValue = isHidden.toLowerCase() === "true";
      //if Menu item has nested submenu items, return the menu item, and execute this  function for
      // the nested submenu items.
      if (nested) {
        return `<li style=${`display:${isHiddenValue ? "none" : "block"}`}>
                <a href=${LinkURL}>.${
          indentation.repeat(depthLevel) + MenuName
        }</a>
                <ul>${createNavMenu(nested, depthLevel + 1)}</ul>
            </li>`;
      } else {
        return `<li style=${`display:${isHiddenValue ? "none" : "block"}`}>
                    <a href=${LinkURL}>.${
          indentation.repeat(depthLevel) + MenuName
        }</a>
                </li>`;
      }
    })
    .join("");
  return NavigationMenu;
};

renderNavMenu = async (pathToLocalCsv) => {
  const parsedCsvToJson = await getAndParseData(pathToLocalCsv);
  const arrayOfNestedMenuElements = reArrangeItems(parsedCsvToJson);
  document.querySelector("ul").innerHTML = createNavMenu(
    arrayOfNestedMenuElements,
    0
  );
};

window.addEventListener("load", renderNavMenu("./csv/Navigation.csv"));
