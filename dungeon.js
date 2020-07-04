// Map size (TODO: configurable??)
const WIDTH = 20;
const HEIGHT = 20;
const FLOORS = 10;

// Display config
const PX_CELL = 36;
const PX_DOT = 2;
const PX_GRID_LINE = 1;
const PX_EDGE_TOLERANCE = 10; // clickable width
const PX_WALL_WIDTH = 4; // drawn width

// global 4 ur convenience
var canvas;
var ctx;

// Map Data
var data = [];

// Some default tiles and markers
var cellTypes = {
    "explored": "#eeeecc",
    "rock": "#444444",
    "darkness": "#000000"
};
var cellMarkTypes = { // 30x30px; not directional
    "ladder_up": "icons/ladder_up.png",
    "ladder_down": "icons/ladder_down.png",
    "key": "icons/key.png",
    "qmark": "icons/qmark.png",
    "epoint": "icons/epoint.png",
    "pittrap": "icons/pittrap.png",
    "elevator": "icons/elevator.png",
    "teleporter": "icons/teleporter.png"
};
var edgeTypes = {"wall": "#444444"};//, "door": "#ffaaff"};
var edgeMarkTypes = { // 10x30px; are directional
    "door": "icons/door_v.png",
    "door_v_1r": "icons/door_v_1r.png",
    "door_v_1l": "icons/door_v_1l.png",
    "door_sec": "icons/door_sec.png",
    "door_sec_r": "icons/door_sec_1l.png",
    "door_sec_l": "icons/door_sec_1r.png"
}

// Tool Selection
var currentFloor = 0;
var currentCellType = Object.entries(cellTypes)[0][0];
var currentCellMark = Object.entries(cellMarkTypes)[0][0];
var currentEdgeType = Object.entries(edgeTypes)[0][0];
var currentEdgeMark = Object.entries(edgeMarkTypes)[0][0];

window.onload = function() {
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

function newCellType() {
    var cellName = prompt("Enter tile name:\n(Entering an existing tile name will change its color instead.)");
    var cellColor = prompt("Enter hex color code (e.g. #ffffff)");
    if (!cellColor.startsWith("#") || cellColor.length != 7) {
        alert("Invalid color, please try again");
        return;
    }
    cellTypes[cellName] = cellColor;
    createPalette();
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
    // place icon
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

function exportMap() {
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
    var text = JSON.stringify(allData);

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
    const file = document.getElementById("uploadfile").files[0];
    console.log("got file: " + file);
    const reader = new FileReader();
    reader.onload = parseMap;
    reader.readAsText(file);
}

function parseMap(e) {
    var values = JSON.parse(e.target.result);
    console.log("loaded map: " + values);

    // TODO? currently ignores the map config values (w/h/layers)

    cellTypes = values.config.cellTypes;
    edgeTypes = values.config.edgeTypes;
    cellMarkTypes = values.config.cellMarkTypes;
    data = values.data;
    currentFloor = 0;

    createPalette();
    redrawMap();
}

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
            btn.style = "background-color: " + value;
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
        if (point.rotation % 180 == 0)
            drawEdge(point);
        else if (point.rotation % 180 == 90)
            drawEdge(point);
        else
            console.error("Unknown rotation", point);
    }
}

function drawEdge(pt) {
    var xpx = pt.x * PX_CELL;
    var ypx = pt.y * PX_CELL;

    // Draw the edge
    if (pt.value != null) {
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
                xpx = WIDTH * PX_CELL;
                ctx.fillRect(
                    xpx - PX_WALL_WIDTH/2,
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
                ypx = HEIGHT * PX_CELL;
                ctx.fillRect(
                    xpx,// + PX_WALL_WIDTH/2,
                    ypx - PX_WALL_WIDTH/2,
                    PX_CELL,// - PX_WALL_WIDTH,
                    PX_WALL_WIDTH);
            }
        }
    }

    // Draw the edge icon
    if (pt.mark != null) {
        var img = new Image();
        img.onload = function() {
            switch (pt.rotation) {
                case 0:
                    var imgx = xpx - img.width/2;
                    var imgy = ypx + (PX_CELL - img.height)/2;
                    ctx.drawImage(img, imgx, imgy);
                    break;
                case 90:
                    var imgx = xpx + img.width/4;
                    var imgy = ypx - img.height/2;

                    ctx.save();

                    ctx.translate(imgx, imgy);
                    ctx.rotate(pt.rotation*Math.PI/180);
                    ctx.drawImage(img, img.width, -img.height);
                    
                    ctx.restore();
                    break;
                case 180:
                    var imgx = xpx - (img.width)/2;
                    var imgy = ypx + (PX_CELL - img.height)/2;

                    ctx.save();

                    ctx.translate(imgx, imgy);
                    ctx.rotate(pt.rotation*Math.PI/180);
                    ctx.drawImage(img, -img.width, -img.height);

                    ctx.restore();
                    break;
                case 270:
                    var imgx = xpx - img.width/4;
                    var imgy = ypx + img.height/2;

                    ctx.save();

                    ctx.translate(imgx, imgy);
                    ctx.rotate(pt.rotation*Math.PI/180);
                    ctx.drawImage(img, img.width, img.height/4);
                    
                    ctx.restore();
                    break;
                default:
                    console.error("Unknown rotation",pt);
            }

            img = null;
        }
        img.src = edgeMarkTypes[pt.mark];
    }
}

function drawCell(pt) {
    var xpx = pt.x * PX_CELL;
    var ypx = pt.y * PX_CELL;

    if (pt.value != null) {
        ctx.fillStyle = cellTypes[pt.value];
        // commented to fill whole cell
        ctx.fillRect(
            xpx,// + PX_WALL_WIDTH/2,
            ypx,// + PX_WALL_WIDTH/2,
            PX_CELL,// - PX_WALL_WIDTH,
            PX_CELL);// - PX_WALL_WIDTH);
    }
    
    if (pt.mark != null) {
        var img = new Image();
        img.onload = function() {
            var imgx = xpx + (PX_CELL-img.width)/2;
            var imgy = ypx + (PX_CELL-img.height)/2;
            ctx.drawImage(img, imgx, imgy);
            img = null;
        };
        img.src = cellMarkTypes[pt.mark];
    }
}
