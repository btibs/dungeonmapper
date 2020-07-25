// Map size
const WIDTH = 20;
const HEIGHT = 20;
var FLOORS = 10;

// Display config
const PX_CELL = 36;
const PX_DOT = 2;
const PX_GRID_LINE = 1;
const PX_EDGE_TOLERANCE = 10; // clickable width
const PX_WALL_WIDTH = 4; // drawn width

// Dimensions for map icons
const CELL_IMG_WIDTH = 30;
const CELL_IMG_HEIGHT = 30;
const EDGE_IMG_WIDTH = 10;
const EDGE_IMG_HEIGHT = 30;

// global 4 ur convenience
var canvas;
var ctx;

// storage
const LOCAL_STORAGE = "localStorage";
const MAP_KEY = "mapdata";
const THEME_KEY = "theme";

// All possible cell icons: 30x30px; not directional
const ALL_CELL_MARKS = {
    "ladder_up": "markers/ladder_up.png",
    "ladder_down": "markers/ladder_down.png",
    "key": "markers/key.png",
    "key_1": "markers/key_1.png",
    "qmark": "markers/qmark.png",
    "epoint": "markers/epoint.png",
    "pittrap": "markers/pittrap.png",
    "elevator": "markers/elevator.png",
    "teleporter": "markers/teleporter.png",
    "pressF": "markers/pressF.png",
    "rotate_random": "markers/tile_rotate_random.png",
    "rotate_ccw": "markers/tile_rotate_ccw.png",
    "rotate_cw": "markers/tile_rotate_cw.png",
    "ribbon": "markers/ribbon_blue.png",
    "badge": "markers/badge.png",
    "statue_wsol": "markers/statue_wsol.png",
    "werdna": "markers/werdna.png",
    "to10": "markers/to10.png",
    "amulet": "markers/amulet.png",
    "chute": "markers/chute.png",
    "exit": "markers/exit.png",
    "teleport_destination": "markers/teleport_destination.png"
};

// All possible edge icons: 10x30px; are directional
const ALL_EDGE_MARKS = {
    "door": "markers/door_v.png",
    "door_v_1r": "markers/door_v_1r.png",
    "door_v_1l": "markers/door_v_1l.png",
    "door_sec": "markers/door_sec.png",
    "door_sec_l": "markers/door_sec_1l.png",
    "door_sec_r": "markers/door_sec_1r.png",
    "oneway_wall_1": "markers/oneway_wall_1.png",
    "oneway_wall_2": "markers/oneway_wall_2.png"
}

// Map Data
var data = [];

// Some default tiles and markers
var cellTypes = {
    "explored": "#eeeecc",
    "rock": "#444444",
    "darkness": "#000000",
    "water": "#4488cc",
    "no magic zone": "#cc4466"
};
var cellMarkTypes = {
    "ladder_up": "markers/ladder_up.png",
    "ladder_down": "markers/ladder_down.png",
    "key": "markers/key.png",
    "qmark": "markers/qmark.png",
    "epoint": "markers/epoint.png",
    "pittrap": "markers/pittrap.png",
    "elevator": "markers/elevator.png",
    "teleporter": "markers/teleporter.png",
    "pressF": "markers/pressF.png"
};
var edgeTypes = {"wall": "#444444"};//, "door": "#ffaaff"};
var edgeMarkTypes = {
    "door": "markers/door_v.png",
    "door_v_1r": "markers/door_v_1r.png",
    "door_v_1l": "markers/door_v_1l.png",
    "door_sec": "markers/door_sec.png",
    "door_sec_l": "markers/door_sec_1l.png",
    "door_sec_r": "markers/door_sec_1r.png"
}

// Tool Selection
var currentFloor = 0;
var currentCellType = Object.entries(cellTypes)[0][0];
var currentCellMark = Object.entries(cellMarkTypes)[0][0];
var currentEdgeType = Object.entries(edgeTypes)[0][0];
var currentEdgeMark = Object.entries(edgeMarkTypes)[0][0];

window.onload = function() {
    if (localStorageAvailable()) {
        // show save/load buttons
        document.getElementById("localbtns").style = "";
    }

    loadTheme();
    clearData();
    createPalette();

    // Initialize canvas
    canvas = document.getElementById("mapcanvas");
    ctx = canvas.getContext("2d");
    canvas.width = WIDTH*PX_CELL;
    canvas.height = HEIGHT*PX_CELL;
    drawGrid();

    // Set up click listeners
    canvas.addEventListener("click", function(event) {
        handleClick(event)
    });
    canvas.addEventListener("contextmenu", function(event) {
        handleRightClick(event)
    });
    canvas.addEventListener("dblclick", function(event) {
        handleDoubleClick(event)
    });

    // Prevent from selecting the canvas element
    canvas.onselectstart = function () { return false; }
}

function toggleTheme() {
    var isDark = document.getElementById("darkmode").checked;
    var theme = isDark ? "theme-dark" : "theme-light"
    setTheme(theme);
    saveTheme(theme);
}

function setTheme(theme) {
    document.documentElement.classList = [theme];
    // only one for now so
    document.getElementById("darkmode").checked = theme == "theme-dark";
}

function clearData() {
    data = [];
    for (i = 0; i < FLOORS; i++) {
        data.push({"cells":[], "edges":[]});
    }
}

function clearMap() {
    // Completely reset the map
    clearData();
    redrawMap();
}

function drawGrid() {
    var useDots = true;

    ctx.strokeStyle = "#aaa";
    ctx.fillStyle = "#555";
    ctx.lineWidth = PX_GRID_LINE;

    if (!useDots) {
        // grid lines
        for (var i = 0; i < WIDTH; i++) {
            ctx.beginPath();
            ctx.moveTo(i * PX_CELL, 0); // start point
            ctx.lineTo(i * PX_CELL, HEIGHT * PX_CELL); // end point
            ctx.stroke();
        }
        for (var j = 0; j < HEIGHT; j++) {
            ctx.beginPath();
            ctx.moveTo(0, j * PX_CELL);
            ctx.lineTo(WIDTH * PX_CELL, j * PX_CELL);
            ctx.stroke();
        }
    } else {
        for (var i = 1; i < WIDTH; i++) {
            for (var j = 1; j < HEIGHT; j++) {
                ctx.fillRect(
                    i*PX_CELL-PX_DOT/2,
                    j*PX_CELL-PX_DOT/2,
                    PX_DOT,
                    PX_DOT);
            }
        }
    }
}

//////////////////////////////////////////////////
// Click events

function handleClick(event) {
    // place tile
    var clickX = event.pageX - canvas.offsetLeft;
    var clickY = event.pageY - canvas.offsetTop;
    
    var x = Math.floor(clickX / PX_CELL);
    var y = Math.floor(clickY / PX_CELL);

    if (clickX % PX_CELL <= PX_EDGE_TOLERANCE/2) {
        handleVertEdge(x, y, currentEdgeType, null);
    } else if (PX_CELL - clickX % PX_CELL <= PX_EDGE_TOLERANCE/2) {
        // clicked on left half
        handleVertEdge(x+1, y, currentEdgeType, null);
    } else if (clickY % PX_CELL <= PX_EDGE_TOLERANCE/2) {
        handleHorizEdge(x, y, currentEdgeType, null);
    } else if (PX_CELL - clickY % PX_CELL <= PX_EDGE_TOLERANCE/2) {
        // clicked on top half
        handleHorizEdge(x, y+1, currentEdgeType, null);
    } else {
        handleCell(x, y, currentCellType, null);
    }
}

function handleRightClick(event) {
    // place marker
    event.preventDefault();
    
    var clickX = event.pageX - canvas.offsetLeft;
    var clickY = event.pageY - canvas.offsetTop;
    
    var x = Math.floor(clickX / PX_CELL);
    var y = Math.floor(clickY / PX_CELL);

    if (clickX % PX_CELL <= PX_EDGE_TOLERANCE/2) {
        handleVertEdge(x, y, null, currentEdgeMark);
    } else if (PX_CELL - clickX % PX_CELL <= PX_EDGE_TOLERANCE/2) {
        // clicked on left half
        handleVertEdge(x+1, y, null, currentEdgeMark);
    } else if (clickY % PX_CELL <= PX_EDGE_TOLERANCE/2) {
        handleHorizEdge(x, y, null, currentEdgeMark);
    } else if (PX_CELL - clickY % PX_CELL <= PX_EDGE_TOLERANCE/2) {
        // clicked on top half
        handleHorizEdge(x, y+1, null, currentEdgeMark);
    } else {
        handleCell(x, y, null, currentCellMark);
    }
}

function handleDoubleClick(event) {
    // Erase element
    var clickX = event.pageX - canvas.offsetLeft;
    var clickY = event.pageY - canvas.offsetTop;
    
    var x = Math.floor(clickX / PX_CELL);
    var y = Math.floor(clickY / PX_CELL);

    // Vertical edge
    if (clickX % PX_CELL <= PX_EDGE_TOLERANCE/2) {
        for (i = 0; i < data[currentFloor].edges.length; i++) {
            var pt = data[currentFloor].edges[i];
            if (pt.x == x && pt.y == y
                    && pt.rotation % 180 == 0) {
                data[currentFloor].edges.splice(i, 1);
                break;
            }
        }
    } else if (PX_CELL - clickX % PX_CELL <= PX_EDGE_TOLERANCE/2) {
        // clicked on left half
        x++;
        for (i = 0; i < data[currentFloor].edges.length; i++) {
            var pt = data[currentFloor].edges[i];
            if (pt.x == x && pt.y == y
                    && pt.rotation % 180 == 0) {
                data[currentFloor].edges.splice(i, 1);
                break;
            }
        }

    // Horizontal edge
    } else if (clickY % PX_CELL <= PX_EDGE_TOLERANCE/2) {
        for (i = 0; i < data[currentFloor].edges.length; i++) {
            var pt = data[currentFloor].edges[i];
            if (pt.x == x && pt.y == y
                    && pt.rotation % 180 == 90) {
                data[currentFloor].edges.splice(i, 1);
                break;
            }
        }
    } else if (PX_CELL - clickY % PX_CELL <= PX_EDGE_TOLERANCE/2) {
        // clicked on top half
        y++;
        for (i = 0; i < data[currentFloor].edges.length; i++) {
            var pt = data[currentFloor].edges[i];
            if (pt.x == x && pt.y == y
                    && pt.rotation % 180 == 90) {
                data[currentFloor].edges.splice(i, 1);
                break;
            }
        }

    // Cell
    } else {
        for (i = 0; i < data[currentFloor].cells.length; i++) {
            var pt = data[currentFloor].cells[i];
            if (pt.x == x && pt.y == y) {
                data[currentFloor].cells.splice(i, 1);
                break;
            }
        }
    }
    redrawMap();
}

function handleVertEdge(x, y, edgeType, mark) {
    if (x == WIDTH) x = 0;
    
    // Remove old value if exists
    var old;
    for (i = 0; i < data[currentFloor].edges.length; i++) {
        var pt = data[currentFloor].edges[i];
        if (pt.x == x && pt.y == y
                && pt.rotation % 180 == 0) {
            old = pt;
            data[currentFloor].edges.splice(i, 1);
            break;
        }
    }
    // Store new value
    var point = {
        "x": x,
        "y": y,
        "value": edgeType,
        "rotation": 0,
        "mark": mark
    };

    if (old != null) {
        point.rotation = old.rotation;
        if (edgeType == null) point.value = old.value;
        if (mark == null) point.mark = old.mark;
    }

    data[currentFloor].edges.push(point);
    drawEdge(point);
}

function handleHorizEdge(x, y, edgeType, mark) {
    if (y == HEIGHT) y = 0;
    
    // Remove old value if exists
    var old;
    for (i = 0; i < data[currentFloor].edges.length; i++) {
        var pt = data[currentFloor].edges[i];
        if (pt.x == x && pt.y == y
                && pt.rotation % 180 == 90) {
            old = pt;
            data[currentFloor].edges.splice(i, 1);
            break;
        }
    }
    // Store new value
    var point = {
        "x": x,
        "y": y,
        "value": edgeType,
        "rotation": 90,
        "mark": mark
    };

    if (old != null) {
        point.rotation = old.rotation;
        if (edgeType == null) point.value = old.value;
        if (mark == null) point.mark = old.mark;
    }

    data[currentFloor].edges.push(point);
    drawEdge(point);
}

function handleCell(x, y, cellType, mark) {
    // Find old value if exists
    var old;
    for (i = 0; i < data[currentFloor].cells.length; i++) {
        var pt = data[currentFloor].cells[i];
        if (pt.x == x
                && pt.y == y) {
            old = pt;
            data[currentFloor].cells.splice(i, 1);
            break;
        }
    }

    // Store new value
    var point = {
        "x": x,
        "y": y,
        "value": cellType,
        "mark": mark
    };

    // Copy old values (if changing bg or fg only)
    if (old != null) {
        if (cellType == null) point.value = old.value;
        if (mark == null) point.mark = old.mark;
    }

    data[currentFloor].cells.push(point);
    drawCell(point);
    redrawEdges();
}

//////////////////////////////////////////////////
// Map to JSON

function getMapAsText() {
    var configInfo = {
        "map": {
            "width": WIDTH,
            "height": HEIGHT,
            "floors": FLOORS
        },
        cellTypes,
        edgeTypes,
        cellMarkTypes,
        edgeMarkTypes
    };
    var allData = {"config":configInfo, "data": data};
    return JSON.stringify(allData, null, 2);
}

function exportMap() {
    var text = getMapAsText();
    var blob = new Blob([text], {type: 'text/plain'});
    var textFile = window.URL.createObjectURL(blob);
    var link = document.getElementById("exportLink");
    link.setAttribute("download", "map.json");
    link.href = textFile;
    blob = null;
}

function enableLoad() {
    var input = document.getElementById("uploadfile");
    document.getElementById("loadbutton").disabled = (input.value == "");
}

function loadMap() {
    var input = document.getElementById("uploadfile");
    const file = input.files[0];
    console.log("got file: " + file);
    const reader = new FileReader();
    reader.onload = parseMap;
    reader.readAsText(file);
    input.value = null; // Reset form
}

function parseMap(e) {
    parseMapText(e.target.result);
}

function parseMapText(text) {
    var values = JSON.parse(text);
    console.log("loaded map",values);

    // TODO: configurable width/height
    FLOORS = values.config.map.floors;

    cellTypes = values.config.cellTypes;
    edgeTypes = values.config.edgeTypes;
    cellMarkTypes = values.config.cellMarkTypes;
    edgeMarkTypes = values.config.edgeMarkTypes;
    data = values.data;
    currentFloor = 0;

    createPalette();
    redrawMap();
}

//////////////////////////////////////////////////
// Palette setup

function isDarkColor(c) {
    // https://stackoverflow.com/a/12043228/ ... kinda
    var c = c.substring(1);      // strip #
    var rgb = parseInt(c, 16);   // convert rrggbb to decimal
    var r = (rgb >> 16) & 0xff;  // extract red
    var g = (rgb >>  8) & 0xff;  // extract green
    var b = (rgb >>  0) & 0xff;  // extract blue

    var luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709
    return (luma < 150);
}

function createPalette() {
    // Cells
    var cellDiv = document.getElementById("cells");
    cellDiv.innerHTML = "";
    for (const [key, value] of Object.entries(cellTypes)) {
        var btn = document.createElement("button");
        btn.setAttribute("onclick", "changeSelectedCellType('" + key + "')");
        btn.innerHTML = key;
        if (isDarkColor(value)) {
            btn.style = "background-color: " + value + "; color:white";
        } else {
            btn.style = "background-color: " + value + "; color:black";
        }
        cellDiv.appendChild(btn);

        if (key == currentCellType) {
            btn.classList.add("current");
        }
    }

    // Edges
    // REMOVED - will only have walls, and doors will be marks
    // var edgeDiv = document.getElementById("edges");
    // edgeDiv.innerHTML = "";
    // for (const [key, value] of Object.entries(edgeTypes)) {
    //     var btn = document.createElement("button");
    //     btn.setAttribute("onclick", "changeSelectedEdgeType('" + key + "')");
    //     btn.innerHTML = key;
    //     btn.style = "background-color: " + value;
    //     edgeDiv.appendChild(btn);

    //     if (key == currentEdgeType) {
    //         btn.classList.add("current");
    //     }
    // }

    // Cell Marks
    var cellMarkDiv = document.getElementById("cellmarks");
    cellMarkDiv.innerHTML = "";
    var ul = document.createElement("ul");
    for (const [key, value] of Object.entries(cellMarkTypes)) {
        var li = document.createElement("li");
        var img = document.createElement("img");
        img.setAttribute("onclick", "changeSelectedCellMark('" + key + "')");
        img.title = key;
        img.classList.add(key);
        img.src = value;

        if (key == currentCellMark) {
            img.classList.add("current");
        }
        li.appendChild(img);
        ul.appendChild(li);
    }
    cellMarkDiv.appendChild(ul);

    // Edge Marks
    var edgeMarkDiv = document.getElementById("edgemarks");
    edgeMarkDiv.innerHTML = "";
    var ul = document.createElement("ul");
    for (const [key, value] of Object.entries(edgeMarkTypes)) {
        var li = document.createElement("li");
        var img = document.createElement("img");
        img.setAttribute("onclick", "changeSelectedEdgeMark('" + key + "')");
        img.title = key;
        img.classList.add(key);
        img.src = value;

        if (key == currentEdgeMark) {
            img.classList.add("current");
        }
        li.appendChild(img);
        ul.appendChild(li);
    }
    edgeMarkDiv.appendChild(ul);


    // Floors
    var floorDiv = document.getElementById("floors");
    floorDiv.innerHTML = "";
    var floorList = document.createElement("ul");
    for (i = 0; i < FLOORS; i++) {
        var li = document.createElement("li");
        var btn = document.createElement("button");
        btn.setAttribute("onclick", "changeFloor(" + i + ")");
        btn.innerHTML = i+1;
        if (i == currentFloor) {
            btn.classList.add("current");
        }
        li.appendChild(btn);
        floorList.appendChild(li);
    }
    floorDiv.appendChild(floorList);
}

//////////////////////////////////////////////////
// Current item selections

function changeFloor(i) {
    currentFloor = i;
    redrawMap();

    // Update current button
    var floorDiv = document.getElementById("floors");
    var lastbtn = floorDiv.getElementsByClassName("current")[0];
    lastbtn.classList.remove("current");
    var curBtn = floorDiv.getElementsByTagName("button")[i];
    curBtn.classList.add("current");
}

function changeSelectedCellType(t) {
    // Update button
    var cellDiv = document.getElementById("cells");
    cellDiv.getElementsByClassName("current")[0].classList.remove("current");

    var btns = cellDiv.getElementsByTagName("button");
    for (i = 0; i < btns.length; i++) {
        if (btns[i].innerText == t) {
            btns[i].classList.add("current");
            break;
        }
    }

    currentCellType = t;
}

function changeSelectedCellMark(t) {
    // Update button
    var markDiv = document.getElementById("cellmarks");
    markDiv.getElementsByClassName("current")[0].classList.remove("current");

    var btns = markDiv.getElementsByTagName("img");
    for (i = 0; i < btns.length; i++) {
        if (btns[i].classList.contains(t)) {
            btns[i].classList.add("current");
            break;
        }
    }

    currentCellMark = t;
}

// function changeSelectedEdgeType(t) {
//     // Update button
//     var edgeDiv = document.getElementById("edgemarks");
//     edgeDiv.getElementsByClassName("current")[0].classList.remove("current");

//     var btns = edgeDiv.getElementsByTagName("button");
//     for (i = 0; i < btns.length; i++) {
//         if (btns[i].innerText == t) {
//             btns[i].classList.add("current");
//             break;
//         }
//     }

//     currentEdgeType = t;
// }

function changeSelectedEdgeMark(t) {
    // Update button
    var markDiv = document.getElementById("edgemarks");
    markDiv.getElementsByClassName("current")[0].classList.remove("current");

    var btns = markDiv.getElementsByTagName("img");
    for (i = 0; i < btns.length; i++) {
        if (btns[i].classList.contains(t)) {
            btns[i].classList.add("current");
            break;
        }
    }

    currentEdgeMark = t;
}

//////////////////////////////////////////////////
// Map Transformation

function rotateLeft() {
    var originX = (WIDTH-1)/2;
    var originY = (HEIGHT-1)/2;
    var s = -1;
    var c = 0;

    // cells
    for (i = 0; i < data[currentFloor].cells.length; i++) {
        var point = data[currentFloor].cells[i];
        var oldX = point.x;
        var oldY = point.y;
        
        // translate to 0,0
        oldX -= originX;
        oldY -= originY;

        // rotate
        var xnew = oldX * c - oldY * s;
        var ynew = oldX * s + oldY * c;

        // translate back
        xnew += originX;
        ynew += originY;

        point.x = xnew;
        point.y = ynew;
        
        if (point.x >= WIDTH) {
            point.x = 0;
        }
        if (point.y >= HEIGHT) {
            point.y = 0;
        }
    }

    // edges
    for (i = 0; i < data[currentFloor].edges.length; i++) {
        var point = data[currentFloor].edges[i];
        var oldX = point.x;
        var oldY = point.y;
        
        // translate to 0,0
        oldX -= originX;
        oldY -= originY;

        // rotate
        var xnew = oldX * c - oldY * s;
        var ynew = oldX * s + oldY * c;

        // translate back
        xnew += originX;
        ynew += originY;

        point.x = xnew;
        point.y = ynew;

        switch (point.rotation) {
            case 0:
                point.rotation = 270;
                point.y++;
                break;
            case 90:
                point.rotation = 0;
                break;
            case 180:
                point.rotation = 90;
                point.y++;
                break;
            case 270:
                point.rotation = 180;
                break;
            default:
                console.error("Unknown rotation" ,point);
        }

        if (point.x >= WIDTH) {
            point.x = 0;
        }
        if (point.y >= HEIGHT) {
            point.y = 0;
        }
    }

    redrawMap();
}

function rotateRight() {
    var originX = (WIDTH-1)/2;
    var originY = (HEIGHT-1)/2;
    var s = 1;
    var c = 0;

    // cells
    for (i = 0; i < data[currentFloor].cells.length; i++) {
        var point = data[currentFloor].cells[i];
        var oldX = point.x;
        var oldY = point.y;
        
        // translate to 0,0
        oldX -= originX;
        oldY -= originY;

        // rotate
        var xnew = oldX * c - oldY * s;
        var ynew = oldX * s + oldY * c;

        // translate back
        xnew += originX;
        ynew += originY;

        point.x = xnew;
        point.y = ynew;

        if (point.x >= WIDTH) {
            point.x = 0;
        }
        if (point.y >= HEIGHT) {
            point.y = 0;
        }
    }

    // edges
    for (i = 0; i < data[currentFloor].edges.length; i++) {
        var point = data[currentFloor].edges[i];
        var oldX = point.x;
        var oldY = point.y;
        
        // translate to 0,0
        oldX -= originX;
        oldY -= originY;

        // rotate
        var xnew = oldX * c - oldY * s;
        var ynew = oldX * s + oldY * c;

        // translate back
        xnew += originX;
        ynew += originY;

        point.x = xnew;
        point.y = ynew;

        switch (point.rotation) {
            case 0:
                point.rotation = 90;
                break;
            case 90:
                point.rotation = 180;
                point.x++;
                break;
            case 180:
                point.rotation = 270;
                break;
            case 270:
                point.rotation = 0;
                point.x++;
                break;
            default:
                console.error("Unknown rotation" ,point);
        }

        if (point.x >= WIDTH) {
            point.x = 0;
        }
        if (point.y >= HEIGHT) {
            point.y = 0;
        }
    }
    redrawMap();
}

function moveUp() {
    for (i = 0; i < data[currentFloor].cells.length; i++) {
        var point = data[currentFloor].cells[i];
        point.y--;
        if (point.y < 0) {
            point.y = HEIGHT-1;
        }
    }
    for (i = 0; i < data[currentFloor].edges.length; i++) {
        var point = data[currentFloor].edges[i];
        point.y--;
        if (point.y < 0) {
            point.y = HEIGHT-1;
        }
    }
    redrawMap();
}

function moveDown() {
    for (i = 0; i < data[currentFloor].cells.length; i++) {
        var point = data[currentFloor].cells[i];
        point.y++;
        if (point.y == HEIGHT) {
            point.y = 0;
        }
    }
    for (i = 0; i < data[currentFloor].edges.length; i++) {
        var point = data[currentFloor].edges[i];
        point.y++;
        if (point.y == HEIGHT) {
            point.y = 0;
        }
    }
    redrawMap();
}

function moveLeft() {
    for (i = 0; i < data[currentFloor].cells.length; i++) {
        var point = data[currentFloor].cells[i];
        point.x--;
        if (point.x < 0) {
            point.x = WIDTH-1;
        }
    }
    for (i = 0; i < data[currentFloor].edges.length; i++) {
        var point = data[currentFloor].edges[i];
        point.x--;
        if (point.x < 0) {
            point.x = WIDTH-1;
        }
    }
    redrawMap();
}

function moveRight() {
    for (i = 0; i < data[currentFloor].cells.length; i++) {
        var point = data[currentFloor].cells[i];
        point.x++;
        if (point.x == WIDTH) {
            point.x = 0;
        }
    }
    for (i = 0; i < data[currentFloor].edges.length; i++) {
        var point = data[currentFloor].edges[i];
        point.x++;
        if (point.x == WIDTH) {
            point.x = 0;
        }
    }
    redrawMap();
}

//////////////////////////////////////////////////
// Map Drawing

function redrawMap() {
    // Clear and re-draw with current data
    ctx.clearRect(0, 0, WIDTH*PX_CELL, HEIGHT*PX_CELL);
    drawGrid();
    
    // cells first
    for (i = 0; i < data[currentFloor].cells.length; i++) {
        var point = data[currentFloor].cells[i];
        drawCell(point);
    }

    // then edges
    redrawEdges();
}

function redrawEdges() {
    for (i = 0; i < data[currentFloor].edges.length; i++) {
        var point = data[currentFloor].edges[i];
        drawEdge(point);
    }
}

function drawEdge(pt) {
    var xpx = pt.x * PX_CELL;
    var ypx = pt.y * PX_CELL;

    // Draw the edge
    if (pt.value != null && edgeTypes[pt.value] != null) {
        ctx.fillStyle = edgeTypes[pt.value];

        // commented parts = fill whole height/width
        if (pt.rotation%180 == 0) {
            // Vertical
            ctx.fillRect(
                xpx - PX_WALL_WIDTH/2,
                ypx,// + PX_WALL_WIDTH/2,
                PX_WALL_WIDTH,
                PX_CELL);// - PX_WALL_WIDTH);

            // wrap around
            if (pt.x == 0) {
                var wrapX = WIDTH * PX_CELL;
                ctx.fillRect(
                    wrapX - PX_WALL_WIDTH/2,
                    ypx,// + PX_WALL_WIDTH/2,
                    PX_WALL_WIDTH,
                    PX_CELL);// - PX_WALL_WIDTH);
            }
        } else if (pt.rotation%90 == 0) {
            // Horizontal
            ctx.fillRect(
                xpx,// + PX_WALL_WIDTH/2,
                ypx - PX_WALL_WIDTH/2,
                PX_CELL,// - PX_WALL_WIDTH,
                PX_WALL_WIDTH);

            // wrap around
            if (pt.y == 0) {
                var wrapY = HEIGHT * PX_CELL;
                ctx.fillRect(
                    xpx,// + PX_WALL_WIDTH/2,
                    wrapY - PX_WALL_WIDTH/2,
                    PX_CELL,// - PX_WALL_WIDTH,
                    PX_WALL_WIDTH);
            }
        }
    }

    // Draw the edge mark
    if (pt.mark != null && edgeMarkTypes[pt.mark] != null) {
        drawEdgeMark(xpx, ypx, pt);

        // if wrapped - do it again on the other side
        if (pt.x == 0) {
            var xWrap = WIDTH * PX_CELL;
            drawEdgeMark(xWrap, ypx, pt);
        } else if (pt.y == 0) {
            var yWrap = HEIGHT * PX_CELL;
            drawEdgeMark(xpx, yWrap, pt);
        }
    }
}

function drawEdgeMark(xpx, ypx, pt) {
    var img = new Image();
    img.onload = function() {
        switch (pt.rotation) {
            case 0:
                var imgx = xpx - EDGE_IMG_WIDTH/2;
                var imgy = ypx + (PX_CELL - EDGE_IMG_HEIGHT)/2;
                ctx.drawImage(img, imgx, imgy, EDGE_IMG_WIDTH, EDGE_IMG_HEIGHT);
                break;
            case 90:
                var imgx = xpx + EDGE_IMG_WIDTH/4;
                var imgy = ypx - EDGE_IMG_HEIGHT/2;

                ctx.save();

                ctx.translate(imgx, imgy);
                ctx.rotate(pt.rotation*Math.PI/180);
                ctx.drawImage(img, EDGE_IMG_WIDTH, -EDGE_IMG_HEIGHT, EDGE_IMG_WIDTH, EDGE_IMG_HEIGHT);
                
                ctx.restore();
                break;
            case 180:
                var imgx = xpx - (EDGE_IMG_WIDTH)/2;
                var imgy = ypx + (PX_CELL - EDGE_IMG_HEIGHT)/2;

                ctx.save();

                ctx.translate(imgx, imgy);
                ctx.rotate(pt.rotation*Math.PI/180);
                ctx.drawImage(img, -EDGE_IMG_WIDTH, -EDGE_IMG_HEIGHT, EDGE_IMG_WIDTH, EDGE_IMG_HEIGHT);

                ctx.restore();
                break;
            case 270:
                var imgx = xpx - EDGE_IMG_WIDTH/4;
                var imgy = ypx + EDGE_IMG_HEIGHT/2;

                ctx.save();

                ctx.translate(imgx, imgy);
                ctx.rotate(pt.rotation*Math.PI/180);
                ctx.drawImage(img, EDGE_IMG_WIDTH, EDGE_IMG_HEIGHT/4, EDGE_IMG_WIDTH, EDGE_IMG_HEIGHT);
                
                ctx.restore();
                break;
            default:
                console.error("Unknown rotation",pt);
        }

        img = null;
    }
    img.src = edgeMarkTypes[pt.mark];
}

function drawCell(pt) {
    var xpx = pt.x * PX_CELL;
    var ypx = pt.y * PX_CELL;

    if (pt.value != null && cellTypes[pt.value] != null) {
        ctx.fillStyle = cellTypes[pt.value];
        // commented to fill whole cell
        ctx.fillRect(
            xpx,// + PX_WALL_WIDTH/2,
            ypx,// + PX_WALL_WIDTH/2,
            PX_CELL,// - PX_WALL_WIDTH,
            PX_CELL);// - PX_WALL_WIDTH);
    }
    
    if (pt.mark != null && cellMarkTypes[pt.mark] != null) {
        var img = new Image();
        img.onload = function() {
            var imgx = xpx + (PX_CELL-CELL_IMG_WIDTH)/2;
            var imgy = ypx + (PX_CELL-CELL_IMG_HEIGHT)/2;
            ctx.drawImage(img, imgx, imgy, CELL_IMG_WIDTH, CELL_IMG_HEIGHT);
            img = null;
        };
        img.src = cellMarkTypes[pt.mark];
    }
}

//////////////////////////////////////////////////
// Local storage

// from MDN: https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
function localStorageAvailable() {
    var storage;
    try {
        storage = window[LOCAL_STORAGE];
        var x = '__storage_test__';
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    } catch(e) {
        return e instanceof DOMException && (
            // everything except Firefox
            e.code === 22 ||
            // Firefox
            e.code === 1014 ||
            // test name field too, because code might not be present
            // everything except Firefox
            e.name === 'QuotaExceededError' ||
            // Firefox
            e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
            // acknowledge QuotaExceededError only if there's something already stored
            (storage && storage.length !== 0);
    }
}

function saveMapLocalStorage() {
    if (!localStorageAvailable()) {
        console.error("local storage not available :(");
        return;
    }

    localStorage = window[LOCAL_STORAGE];
    var text = getMapAsText();
    try {
        localStorage.setItem(MAP_KEY, text);
        console.log("Saved to local storage");

        var checkmark = document.getElementById("saveconfirm");
        checkmark.style.opacity = '1';
        setTimeout("fadeOutCheck()", 1000);
    } catch (e) {
        console.error(e);
        alert("Could not save map! Please use the export function instead.");
    }
}

function fadeOutCheck() {
    var checkmark = document.getElementById("saveconfirm");
    checkmark.style.opacity = '0';
}

function loadMapLocalStorage() {
    if (!localStorageAvailable()) {
        console.error("local storage not available :(");
        return;
    }

    localStorage = window[LOCAL_STORAGE];
    try {
        var text = localStorage.getItem(MAP_KEY);
        parseMapText(text);
        console.log("Loaded from local storage");
    } catch (e) {
        console.error(e);
        alert("Could not load map! Please use the load map file function instead.");
    }
}

function saveTheme(theme) {
    if (!localStorageAvailable()) {
        console.error("local storage not available :(");
        return;
    }

    localStorage = window[LOCAL_STORAGE];
    try {
        localStorage.setItem(THEME_KEY, theme);
    } catch (e) {
        console.error(e);
    }
}

function loadTheme() {
    if (!localStorageAvailable()) {
        console.error("local storage not available :(");
        return;
    }

    localStorage = window[LOCAL_STORAGE];
    try {
        theme = localStorage.getItem(THEME_KEY);
        if (theme != null) setTheme(theme);
    } catch (e) {
        console.error(e);
    }
}

//////////////////////////////////////////////////
// Map Configuration

function showConfig() {
    var modal = document.getElementById("config-modal");
    modal.style.display="block";

    // allow clicking outside it to close
    window.onclick = function(event) {
      if (event.target == modal) {
        modal.style.display = "none";
      }
    }

    // floors
    var floorsInput = document.getElementById("numfloors");
    floorsInput.value = FLOORS;
    floorsInput.classList = [];

    // tile types
    var cellTypeTable = document.getElementById("cellconfigtable");
    // remove everything but header row
    while (cellTypeTable.childElementCount > 1) {
        cellTypeTable.removeChild(cellTypeTable.children[1]);
    }
    // populate current list
    for (const [name, color] of Object.entries(cellTypes)) {
        var tr = document.createElement("tr");

        var td1 = document.createElement("td");
        var i1 = document.createElement("input");
        i1.value = name;
        i1.disabled = "disabled";
        td1.appendChild(i1);
        tr.appendChild(td1);

        var td2 = document.createElement("td");
        var i2 = document.createElement("input");
        i2.value = color;
        td2.appendChild(i2);
        tr.appendChild(td2);

        var td3 = document.createElement("td");
        var i3 = document.createElement("input");
        i3.type = "checkbox";
        td3.appendChild(i3);
        tr.appendChild(td3);

        cellTypeTable.appendChild(tr);
    }

    // tile icons
    var cellMarkDiv = document.getElementById("cellmarkconfig");
    cellMarkDiv.innerHTML = "";
    var actuallyAllCellMarks = JSON.parse(JSON.stringify(ALL_CELL_MARKS));
    for (const [name, src] of Object.entries(cellMarkTypes)) {
        if (ALL_CELL_MARKS[name] == null) { // custom
            actuallyAllCellMarks[name] = src;
        }
    }
    for (const [name, src] of Object.entries(actuallyAllCellMarks)) {
        var img = document.createElement("img");
        img.title = name;
        img.src = src;
        img.classList = [name]
        if (cellMarkTypes[name] != null) {
            img.classList.add("current");
        }
        img.setAttribute("onclick", "toggleCellMarkAvailable('" + name + "')");
        cellMarkDiv.appendChild(img);
    }

    // edge icons
    var edgeMarkDiv = document.getElementById("edgemarkconfig");
    edgeMarkDiv.innerHTML = "";
    var actuallyAllEdgeMarks = JSON.parse(JSON.stringify(ALL_EDGE_MARKS));
    for (const [name, src] of Object.entries(edgeMarkTypes)) {
        if (ALL_EDGE_MARKS[name] == null) { // custom
            actuallyAllEdgeMarks[name] = src;
        }
    }
    for (const [name, src] of Object.entries(actuallyAllEdgeMarks)) {
        var img = document.createElement("img");
        img.title = name;
        img.src = src;
        img.classList = [name]
        if (edgeMarkTypes[name] != null) {
            img.classList.add("current");
        }
        img.setAttribute("onclick", "toggleEdgeMarkAvailable('" + name + "')");
        edgeMarkDiv.appendChild(img);
    }
}

function hideConfig() {
    var modal = document.getElementById("config-modal");
    modal.style.display="none";
}

function saveConfig() {
    var valid = updateNumFloors();
    valid &= updateCellTypes();
    valid &= updateCellMarks();
    valid &= updateEdgeMarks();

    if (!valid) {
        return; // don't update or close so user can correct
    }

    // Refresh controls
    createPalette();
    hideConfig();
    redrawMap();
}

function updateNumFloors() {
    var floorsInput = document.getElementById("numfloors");
    var newFloors = floorsInput.value;

    if (newFloors <= 0) {
        console.error("Invalid number of floors!");
        floorsInput.classList = ["input-error"];
        return false;
    } else {
        floorsInput.classList = [];
    }

    if (newFloors == FLOORS) {
        return true;
    }

    if (currentFloor >= newFloors) {
        changeFloor(newFloors-1);
    }

    if (newFloors < FLOORS) {
        // delete extra floors
        for (i = newFloors; i < FLOORS; i++) {
            data.pop();
        }
    } else {
        // add new floors
        for (i = FLOORS; i < newFloors; i++) {
            data.push({"cells":[], "edges":[]});
        }
    }
    FLOORS = newFloors;
    return true;
}

function newCellType() {
    var cellTypeTable = document.getElementById("cellconfigtable");
    var tr = document.createElement("tr");

    var td1 = document.createElement("td");
    var i1 = document.createElement("input");
    td1.appendChild(i1);
    tr.appendChild(td1);

    var td2 = document.createElement("td");
    var i2 = document.createElement("input");
    td2.appendChild(i2);
    tr.appendChild(td2);

    var td3 = document.createElement("td");
    var i3 = document.createElement("input");
    i3.type = "checkbox";
    td3.appendChild(i3);
    tr.appendChild(td3);

    cellTypeTable.appendChild(tr);
}

function updateCellTypes() {
    var cellTypeTable = document.getElementById("cellconfigtable");
    var valid = true;

    // clone temporarily so we don't mess up the list if it fails
    var updatedCellTypes = JSON.parse(JSON.stringify(cellTypes));
    for (i = 1; i < cellTypeTable.childElementCount; i++) {
        var tr = cellTypeTable.children[i];
        var name = tr.children[0].children[0].value;
        var color = tr.children[1].children[0].value;
        var toDelete = tr.children[2].children[0].checked;

        if (toDelete) {
            delete updatedCellTypes[name];
            if (currentCellType == name) {
                changeSelectedCellType(Object.keys(updatedCellTypes)[0]);
            }
        } else {
            if (color.startsWith("#") && color.length == 7) {
                updatedCellTypes[name] = color;
                tr.children[1].children[0].classList = [];
            } else {
                tr.children[1].children[0].classList = ["input-error"];
                valid = false;
            }
        }
    }

    if (valid) {
        cellTypes = updatedCellTypes;
        //TODO: delete cells in data that were a deleted type?
    } else {
        console.error("Invalid entries, cell changes were not saved");
    }
    return valid;
}

function toggleCellMarkAvailable(name) {
    var cellMarkDiv = document.getElementById("cellmarkconfig");
    var item = cellMarkDiv.getElementsByClassName(name)[0];
    if (item.classList.contains("current")) {
        item.classList.remove("current");
    } else {
        item.classList.add("current");
    }
}

function newCellMarkType() {
    var cellMarkDiv = document.getElementById("cellmarkconfig");
    var div = document.createElement("div");
    var nameLabel = document.createElement("label");
    nameLabel.innerHTML = "Name:";
    var nameInput = document.createElement("input");
    var urlLabel = document.createElement("label");
    urlLabel.innerHTML = "Icon URL:";
    var urlInput = document.createElement("input");
    div.appendChild(nameLabel);
    div.appendChild(nameInput);
    div.appendChild(urlLabel);
    div.appendChild(urlInput);
    cellMarkDiv.appendChild(div);
}

function updateCellMarks() {
    var cellMarkDiv = document.getElementById("cellmarkconfig");
    for (e of cellMarkDiv.getElementsByTagName("img")) {
        if (e.classList.contains("current")) {
            cellMarkTypes[e.title] = e.src;
        } else {
            delete cellMarkTypes[e.title];
        }
    }

    // check for custom ones
    for (e of cellMarkDiv.getElementsByTagName("div")) {
        var name = e.getElementsByTagName("input")[0].value;
        var url = e.getElementsByTagName("input")[1].value;
        if (name == null || url == null || name == "" || url == "") {
            console.error("Not adding tile icon",name, url);
        } else {
            cellMarkTypes[name] = url;
        }
    }

    return true;
}

function toggleEdgeMarkAvailable(name) {
    var edgeMarkDiv = document.getElementById("edgemarkconfig");
    var item = edgeMarkDiv.getElementsByClassName(name)[0];
    if (item.classList.contains("current")) {
        item.classList.remove("current");
    } else {
        item.classList.add("current");
    }
}

function newEdgeMarkType() {
    var edgeMarkDiv = document.getElementById("edgemarkconfig");
    var div = document.createElement("div");
    var nameLabel = document.createElement("label");
    nameLabel.innerHTML = "Name:";
    var nameInput = document.createElement("input");
    var urlLabel = document.createElement("label");
    urlLabel.innerHTML = "Icon URL:";
    var urlInput = document.createElement("input");
    div.appendChild(nameLabel);
    div.appendChild(nameInput);
    div.appendChild(urlLabel);
    div.appendChild(urlInput);
    edgeMarkDiv.appendChild(div);
}

function updateEdgeMarks() {
    var edgeMarkDiv = document.getElementById("edgemarkconfig");
    for (e of edgeMarkDiv.getElementsByTagName("img")) {
        if (e.classList.contains("current")) {
            edgeMarkTypes[e.title] = e.src;
        } else {
            delete edgeMarkTypes[e.title];
        }
    }

    // check for custom ones
    for (e of edgeMarkDiv.getElementsByTagName("div")) {
        var name = e.getElementsByTagName("input")[0].value;
        var url = e.getElementsByTagName("input")[1].value;
        if (name == null || url == null || name == "" || url == "") {
            console.error("Not adding edge icon",name, url);
        } else {
            edgeMarkTypes[name] = url;
        }
    }
    return true;
}
