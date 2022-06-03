// Getting context of canvas
canvas = document.getElementById('canvas');
ctx = canvas.getContext('2d');
ctx.fillRect(0, 0, canvas.height, canvas.width);

let brushRadius = 12;
let refreshTime = 20; // After these many milliseconds check if mouse is pressed
let predictionBox = document.getElementById('prediction');
let displayPredictedDigit = 'block';
let isFetching = false;
let calculationAnimation = null;
predictionBox.innerText = '';
let classifier = document.getElementById('classifier-dropdown').value;

let x = 0;
let y = 0;

document.getElementById('classifier-dropdown').addEventListener('change', (e) => {
    classifier = e.target.value;
})

canvas.addEventListener('mousemove', (e) => {
    let rect = canvas.getBoundingClientRect();
    x = e.clientX - rect.left;
    y = e.clientY - rect.top;
})

// Checking if mouse is currently pressed
let interval = null;
let isMouseDown = false;

// When user starts to draw
canvas.addEventListener('mousedown', () => {
    if (calculationAnimation) {
        clearInterval(calculationAnimation);
    }

    isMouseDown = true;
    predictionBox.style.innerText = ''
    ctx.fillStyle = '#fff';

    interval = setInterval(() => {
        if (x <= 2 || y <= 2 || x >= canvas.width - 3 || y >= canvas.height - 3) {
            isMouseDown = false;
        }
        if (isMouseDown) {
            ctx.beginPath();
            ctx.arc(x, y, brushRadius, 0, 2 * Math.PI)
            ctx.fill();
        }
    }, refreshTime);
})

const predictionAnimation = (element, refreshTime = 40) => {
    let curr = 100;
    let dir = 1;
    let lowerlim = 100;
    let upperlim = 200;
    let step = 10;

    calculationAnimation = setInterval(() => {
        let next = curr;
        if (dir == 1) {
            next = (next + step > upperlim ? upperlim : next + step)
            next = (next + step > upperlim ? upperlim : next + step)
            if (next == upperlim) dir = -1;
        } else {
            next = (next - step < lowerlim ? lowerlim : next - step)
            if (next == lowerlim) dir = 1;
        }
        curr = next;

        let c = `#00${next.toString(16)}${next.toString(16)}`
        element.style.backgroundColor = c;
    }, refreshTime);
}

const randomColor = () => {
    let arr = [Math.floor(255 * Math.random()), Math.floor(255 * Math.random()), Math.floor(255 * Math.random())];
    let c = `#${arr[0].toString(16)}${arr[0].toString(16)}${arr[0].toString(16)}`

    return c;
}

const centerImage = (mtx) => {
    // Cenering the image horizontally 
    let dim = mtx.length;

    let up = 0;
    for (let i = 0; i < dim; i++) {
        let flag = true;
        for (let j = 0; j < dim; j++) {
            if (mtx[i][j]) flag = false;
        }
        if (!flag) break;
        up++;
    }

    let down = dim - 1;
    for (let i = dim - 1; i >= 0; i--) {
        let flag = true;
        for (let j = 0; j < dim; j++) {
            if (mtx[i][j]) flag = false;
        }
        if (!flag) break;
        down--;
    }

    // Cenering the image vertically 
    let left = 0;
    for (let i = 0; i < dim; i++) {
        let flag = true;
        for (let j = 0; j < dim; j++) {
            if (mtx[j][i]) flag = false;
        }
        if (!flag) break;
        left++;
    }

    let right = dim - 1;
    for (let i = dim - 1; i >= 0; i--) {
        let flag = true;
        for (let j = 0; j < dim; j++) {
            if (mtx[j][i]) flag = false;
        }
        if (!flag) break;
        right--;
    }

    let newMtx = [];
    for (let i = 0; i < dim; i++) {
        let vec = mtx[0].map(row => 0);
        newMtx.push(vec);
    }
    let newLeft = Math.floor((dim - (right - left + 1)) / 2);
    let newRight = Math.floor(dim - (dim - (right - left + 1)) / 2);
    let newUp = Math.floor((dim - (down - up + 1)) / 2);
    let newDown = Math.floor(dim - (dim - (down - up + 1)) / 2);

    for (let i = 0; i <= newDown - newUp; i++) {
        for (let j = 0; j < newRight - newLeft; j++) {
            let ai = up + i,
                aj = left + j,
                bi = newUp + i,
                bj = newLeft + j;
            if (mtx[ai][aj]) newMtx[bi][bj] = 1;
        }
    }
    // for (let j = up; j <= down; j++) {
    //     for (let i = left; i <= right; i++) {
    //         newMtx[i][j] = 1;
    //     }
    // }

    // for (let j = 0; j <= down - up; j++) {
    //     for (i = 0; i <= right - left; i++) {
    //         newMtx[newUp + j][newLeft + i] = mtx[up + j][left + i];
    //     }
    // }
    return newMtx;
}


const getEquivalentText = (imgData) => {
    let imgDataValues = [];
    for (let i = 0; i < imgData.data.length; i += 4) imgDataValues.push(imgData.data[i]);

    let imgMtx = []
    let vec = []
    for (let i = 0; i < imgDataValues.length; i++) {
        if (i % 336 == 0) {
            if (i != 0) imgMtx.push(vec);
            vec = []
        }
        vec.push(imgDataValues[i] > 0 ? 1 : 0)
    }
    imgMtx.push(vec);

    imgMtx = centerImage(imgMtx);

    let dataToSend = "";
    let densityThreshold = 30;

    let gapWidth = Math.floor(canvas.height / 28);
    let gapHeight = Math.floor(canvas.width / 28);
    for (let row = 0; row < imgMtx.length; row += gapWidth) {
        for (let col = 0; col < imgMtx[row].length; col += gapHeight) {
            let total = 0;
            for (let i = 0; i < gapWidth; i++) {
                for (let j = 0; j < gapHeight; j++) {
                    total += (imgMtx[row + i][col + j] == 1 ? 1 : 0);
                }
            }
            dataToSend += (total > densityThreshold ? '1' : '0');
        }
    }
    return dataToSend;
}

// For Development only
// Shows a preview of the digit sent as text
const showDummyCanvas = (dataToSend) => {
    let dummyCanvas = document.getElementById('dummy-canvas');
    let dummyCtx = dummyCanvas.getContext('2d');

    dummyCtx.fillStyle = '#000';
    dummyCtx.fillRect(0, 0, 28, 28);

    dummyCtx.fillStyle = '#f00';
    for (let i = 0; i < 28; i++) {
        for (let j = 0; j < 28; j++) {
            if (dataToSend[28 * i + j] == '1') {
                dummyCtx.fillRect(j, i, 1, 1);
                dummyCtx.fill();
            }
        }
    }
}


// When user finishes to draw
canvas.addEventListener('mouseup', () => {
    if (interval) {
        clearInterval(interval);
    }

    predictionAnimation(predictionBox);

    isMouseDown = false;

    let imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    let dataToSend = getEquivalentText(imgData);

    // Show a small canvas of size 28 x 28 in which image has been resized
    // showDummyCanvas(dataToSend);

    fetch('/prediction', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: JSON.stringify({ imageData: dataToSend, classifier: classifier }),
        })
        .then(response => response.json())
        .then(data => {
            predictionBox.innerText = data.prediction;
            if (calculationAnimation) clearInterval(calculationAnimation);
            predictionBox.style.background = 'inherit';
        })
        .catch(err => console.log(err));

})


// Paint the screen black again
let resetBtn = document.getElementById('reset-button');
resetBtn.addEventListener('click', () => {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.height, canvas.width);
});