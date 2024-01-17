// Gets the element
const keys = document.querySelectorAll('.key');
const bars = document.querySelectorAll('.bar');
const scoreDisplayElement = document.querySelector('.point span');

// Speed and Crowd
const getSpeedFromBarHeight = ()=>{
    const barContainerElement = document.querySelector('.bar-container');
    const barContainerHeight = parseFloat(window.getComputedStyle(barContainerElement, null).getPropertyValue('height'));
    
    const speed = {
        slow: barContainerHeight / 400, 
        medium: barContainerHeight / 350, 
        fast: barContainerHeight / 300
    };

    return speed;
};

const typeOfSize = ()=>{
    let keyHeight = parseFloat(window.getComputedStyle(document.querySelector('.key-container'), null).getPropertyValue('height'));
    let typeAndWeightArray = [{
        'Type 1': keyHeight,
        weight: 30
    }, {
        'Type 2': keyHeight * 2,
        weight: 4
    }, {
        'Type 3': keyHeight * 3,
        weight: 3
    }, {
        'Type 4': keyHeight * 4,
        weight: 2
    }, {
        'Type 5': keyHeight * 5,
        weight: 1
    }];

    let availableType = [];
    for(let obj of typeAndWeightArray){
        for(let key in obj){
            if(key.indexOf('Type') !== -1){
                availableType.push(key);
            };
        };
    };
    return {typeAndWeightArray: typeAndWeightArray, availableType: availableType};
};

const barCrowdSettings = {
    deserted: [400, 1.4],
    common: [350, 1.2],
    crowd: [300, 1]
};

// The Variabel that contain numeric value
let countOfBarsDisplayed = 0;
let gameBarCount = 10;
let point = 0;

// Variabel that contain an array, object, and bar information
const applyBarName = (obj, isGone)=>{
    for(let i = 1; i <= gameBarCount; i++){
        obj[`bar-number-${i}`] = {};
        if(isGone) obj[`bar-number-${i}`].isGone = false;
    };
};
let keysDown = {a: false, s: false, j: false, k: false, l: false};
let gameBarOutcomes = [];
let highScoreArr = [0];
let barMetrics = {};
applyBarName(barMetrics, false);

// Validation Variabel
let isTheInstructionOpen = false;
let isLastBarDisplayed = false;
let isPause = false;
let isPlay = false;

// Interval for Every Bar
let barInfo = {barCreationAndAnimationInterval: null, speed: null, crowded: null};

// Event Listener Handle Function
const startWithSpace = e=>{ if(e.key === ' ' && !isPlay) start() };

const keyDownHandler = (e)=>{
    let key = e.key.toLowerCase();
    let each = ['a', 's', 'j', 'k', 'l'];
    for(let i = 0; i < keys.length; i++){
        if(key === each[i] && keysDown.hasOwnProperty(key) && !keysDown[key]){
            keys[i].classList.add('active');
            checkBarPosition(keys[i], bars[i]);
            keysDown[key] = true;
        };
    };
};

const keyUpHandler = (e)=>{
    let key = e.key.toLowerCase();
    let each = ['a', 's', 'j', 'k', 'l'];
    for(let i = 0; i < keys.length; i++){
        if(key === each[i]){
            keys[i].classList.remove('active');
            setBarEndPositionAndLastHeight(bars[i]);
            keysDown[key] = false;
        };
    };
};

const giveInstruction = async (e)=>{
    if(e.ctrlKey  && e.code === 'Slash' && !isTheInstructionOpen){
        const instructionSection = document.querySelector('.instruction-section');
        let keyword = ['a', 's', 'j', 'k', 'l'];
        const keySpanElement = document.querySelectorAll('.key span');
        let i = 0;
        let keywordPrintInterval = setInterval(()=>{
            keySpanElement[i].innerHTML = keyword[i].toUpperCase();
            i >= keyword.length - 1 ? clearInterval(keywordPrintInterval) : i++;
        }, 500);

        instructionSection.style.display = 'block';
        isTheInstructionOpen = true;
        setTimeout(async ()=>{
            instructionSection.classList.add('roll-in');
            let keywordClearInterval = setInterval(()=>{
                if(i <= 0) clearInterval(keywordClearInterval);
                keySpanElement[i].innerHTML = "";
                i--;
            }, 500);

            await pending(2500);
            instructionSection.classList.remove('roll-in');
            instructionSection.style.display = 'none';
            isTheInstructionOpen = false;
        }, 5000);
    };
};

const chooseDifficulty = (e)=>{
    let key = e.key.toLowerCase();
    const difficulty = document.querySelector('.difficulty');

    let keysObj = {z: 'Easy', x: 'Normal', c: 'Hard'};
    for(let val in keysObj){
        if(e.ctrlKey && key === val){
            difficulty.innerHTML = keysObj[val];
        };
    };
};

const pause = (e)=>{
    if(!isPlay) return;
    if(e.key === 'Escape'){
        if(isPause) return;

        clearInterval(barCreationAndAnimationInterval);
        for(let barNumber in barInfo){
            if(!barInfo[barNumber].isGone){
                clearInterval(barInfo[barNumber].animateBarDescending);
                if(barInfo[barNumber].decreaseBarHeight){
                    clearInterval(barInfo[barNumber].decreaseBarHeight);
                };
            };
        };

        document.body.removeEventListener('keydown', keyDownHandler);
        document.body.removeEventListener('keyup', keyUpHandler);
        window.addEventListener('keydown', resume);
        isPause = true;
    };
};

const resume = (e)=>{
    if(e.key === 'Escape'){
        document.body.addEventListener('keydown', keyDownHandler);
        document.body.addEventListener('keyup', keyUpHandler);
        window.removeEventListener('keydown', resume);
        isPause = false;

        bars.forEach(bar=>{
            for(let child of bar.children){
                animateBarDescending(child, barInfo.speed, barInfo.crowded);
            };
        });

        let barTotal = countOfBarsDisplayed;
        barCreationAndAnimationInterval = setInterval(()=>{
            barTotal++;
            console.log(`barTotal Resume= ${barTotal}`);
            let barDown = generateBarWithAttributes(barTotal);
            animateBarDescending(barDown[0], barInfo.speed, barInfo.crowded[1]);
    
            let obj = barDown[1];
            obj['At Bar Number'] = barDown[2] + 1;
            obj['Bar Number'] = barTotal;
            gameBarOutcomes.push(obj);
            
            if(barTotal > gameBarCount){
                clearInterval(barCreationAndAnimationInterval);
                let isLast = setInterval(()=>{
                    finish(isLast, barInfo.difficulty);
                }, 1);
            };
        }, barInfo.crowded[0]);
    };
};

const start = ()=>{
    document.body.addEventListener('keydown', keyDownHandler);
    document.body.addEventListener('keyup', keyUpHandler);
    scoreDisplayElement.innerHTML = 0;

    gameLogicc();
    isPlay = true;
};


// Game Logic
const generateBarWithAttributes = (num)=>{
    // Make a new Element
    const barDown = document.createElement('div');
    barDown.classList.add('bar-down');
    barDown.classList.add(`bar-number-${num}`);

    // Put it Randomly
    let random = putBarRandomdly(barDown);
    let barHeight = selectRandomBarSize();
    let obj = barHeight[1];
    let height = barHeight[0];
    barDown.classList.add(`Type-${height[height.length-1]}`);
    // Define its height
    barDown.style.height = obj[height] + 'px';

    // Save it Stats
    let barStats = {
        top: parseFloat(window.getComputedStyle(barDown, null).getPropertyValue('height')) * -1,
        height: obj[height],
        isGone: false,
    };

    barInfo[`bar-number-${num}`] = barStats;
    return [barDown, obj, random];
};

const selectRandomBarSize = ()=>{
    let select = weightedRandomSelection(typeOfSize().typeAndWeightArray);
    let type = typeOfSize().availableType;

    let height;
    for(let i = 0; i < type.length; i++){
        if(select.hasOwnProperty(type[i])){
            height = type[i];
        };
    };

    for(let i = 0; i < type.length; i++){
        if(height === type[i]){
            let obj = {};
            obj[`${height}`] = select[`${height}`];
            return [height, obj];
        };
    };
};

const putBarRandomdly = (bar)=>{
    let random;
    let safeDistance = 10;
    do{
        random = Math.floor(Math.random() * 5);
    } while(bars[random].lastChild && parseFloat(bars[random].lastChild.style.top) < safeDistance);
    // do while yang di atas di di gunakan untuk validasi, bunyinya begini, pertama kita dapetin random numbernya dulu nih, terus abis itu kita cek KALAU MISALKAN element terakhir yang ada di bars tersebut style.top nya lebih kecil dari safeDistance yang udah kita tentuin maka kita bakal cek bar yang laennya, kalau misalkan kaga, yaudah kita langsung masukin buat bar ke stick bar nya itu
    bars[random].appendChild(bar);
    return random;
};

const animateBarDescending = (elem, speed, crowded)=>{
    let barNumber = checkTheBarNumber(elem);
    console.log(elem);
    elem.style.top = barInfo[barNumber].top + 'px';

    let barDescendingInterval = setInterval(() => {
        elem.style.top = barInfo[barNumber].top + 'px';
        barInfo[barNumber].top += speed;
        if(elem.getBoundingClientRect().bottom >= keys[0].getBoundingClientRect().bottom){
            clearInterval(barDescendingInterval);
            decreaseBarHeight(elem, speed, crowded);
        };
    }, crowded);

    //  Save the interval
    barInfo[barNumber].animateBarDescending = barDescendingInterval;
};

const decreaseBarHeight = (elem, speed, crowded)=>{
    let barNumber = checkTheBarNumber(elem);

    let decreaseBarHeightInterval = setInterval(()=>{
        highlightMissedBars(barMetrics, elem);
        elem.style.height = barInfo[barNumber].height + 'px';
        elem.style.top = barInfo[barNumber].top + 'px';
        barInfo[barNumber].height -= speed;
        barInfo[barNumber].top += speed;

        if(barInfo[barNumber].height <= 0){
            clearInterval(decreaseBarHeightInterval);
            barInfo[barNumber].isGone = true;
            elem.remove();
            countOfBarsDisplayed++;
            if(countOfBarsDisplayed === gameBarCount){
                isLastBarDisplayed = true;
            };
        };
    }, crowded);

    //  Save the interval
    barInfo[barNumber].decreaseBarHeight = decreaseBarHeightInterval;
};

let barCreationAndAnimationInterval;
const gameLogicc = ()=>{
    let barTotal = countOfBarsDisplayed;

    barInfo.difficulty = document.querySelector('.difficulty').textContent.split('\n')[0];
    const difficulty = barInfo.difficulty;
    switch(difficulty){
        case 'Easy':
            barInfo.crowded = barCrowdSettings.deserted;
            barInfo.speed = getSpeedFromBarHeight().slow;
            break;
        case 'Normal':
            barInfo.crowded = barCrowdSettings.common;
            barInfo.speed = getSpeedFromBarHeight().medium;
            break;
        case 'Hard':
            barInfo.crowded = barCrowdSettings.crowd;
            barInfo.speed = getSpeedFromBarHeight().fast;
            break;
    };
    
    barCreationAndAnimationInterval = setInterval(()=>{
        barTotal++;
        console.log(barTotal);
        let barDown = generateBarWithAttributes(barTotal);
        animateBarDescending(barDown[0], barInfo.speed, barInfo.crowded[1]);
        
        let obj = barDown[1];
        obj['At Bar Number'] = barDown[2] + 1;
        obj['Bar Number'] = barTotal;
        gameBarOutcomes.push(obj);

        if(barTotal >= gameBarCount){
            clearInterval(barCreationAndAnimationInterval);
            let isLast = setInterval(()=>{
                finish(isLast, difficulty);
            }, 1);
        };
    }, barInfo.crowded[0]);

    // Save the interval
    barInfo.barCreationAndAnimationInterval = barCreationAndAnimationInterval;
};


// Score and Highscore
const calculateTotalPoints = (obj, difficulty)=>{
    let total = 0;
    let theHeigt = parseFloat((window.getComputedStyle(keys[0], null).getPropertyValue('height')));
    let counting = difficulty === 'Easy' ? theHeigt * 0.90 : difficulty === 'Normal' ? theHeigt * 0.80 : theHeigt * 0.60;
    for(let barDown in obj){
        if(obj[barDown].hasOwnProperty('firstHeight')){
            if(!obj[barDown].hasOwnProperty('endPosition') && !obj[barDown].hasOwnProperty('lastHeight')){
                obj[barDown]['endPosition'] = keys[0].getBoundingClientRect().bottom;
                obj[barDown]['lastHeight'] = 0;
            };
            obj[barDown]['result'] = obj[barDown]['firstHeight'] - obj[barDown]['lastHeight'];
            for(let key in obj[barDown]){
                if(key !== 'result'){
                    delete obj[barDown][key];
                };
            };
        } else if(obj[barDown].hasOwnProperty('Type-1')){
            switch(difficulty){
                case 'Easy':
                    obj[barDown]['result'] = 1;
                    break;
                case 'Normal':
                    obj[barDown]['result'] = 2;
                    break;
                case 'Hard':
                    obj[barDown]['result'] = 3;
                    break;
            };

            delete obj[barDown]['Type-1'];
        } else{
            delete obj[barDown];
        };
    };

    for(let barDown in obj){
        if(obj[barDown]['result'] > 1){
            total += Math.ceil(obj[barDown]['result'] / counting);
        } else{
            total += obj[barDown]['result'];
        };
    };
    return Math.ceil(total);
};

const displayScore = ()=>{
    scoreDisplayElement.innerHTML = point;
    let highScore = checkHighScore(highScoreArr, point);
    displayHighScore(highScore[0], highScore[1]);
    point = 0;
};

const incrementScore = (score)=>{
    let incrementScoreInterval = setInterval(()=>{
        scoreDisplayElement.innerHTML = point;
        point++;
        if(point >= score){
            displayScore();
            clearInterval(incrementScoreInterval);
        };
    }, 100);
};

const displayHighScore = async (scoreStatus, score)=>{
    if(scoreStatus === 'New'){
        // Make an Element
        const highScoreWrapper = document.createElement('div');
        highScoreWrapper.classList.add('high-score-wrapper');
        const highScoreDisplayElement = document.createElement('span');
        highScoreWrapper.appendChild(highScoreDisplayElement);
        document.body.appendChild(highScoreWrapper);

        // Display it and play with the Animation
        highScoreWrapper.style.display = 'flex';
        highScoreDisplayElement.innerHTML = `New High Score: ${score}`;
        await pending(5000);
        highScoreWrapper.style.display = 'none';
        // remove the element
        highScoreWrapper.remove();
    };
};

const checkHighScore = (arr, point)=>{
    let currentHighScore = 0;
    for(let i = 0; i < arr.length; i++){
        if(arr[i] > currentHighScore){
            currentHighScore = arr[i];
        };
    };

    let newHighScore = 0;
    arr.push(point);
    for(let i = 0; i < arr.length; i++){
        if(arr[i] > newHighScore){
            newHighScore = arr[i];
        };
    };

    return newHighScore > currentHighScore ? ['New', newHighScore] : ['Current', currentHighScore];
};


// Ending game
const resetGame = ()=>{
    barMetrics = {};
    applyBarName(barMetrics);
    isLastBarDisplayed = false;
    countOfBarsDisplayed = 0;
    barTotalAgain = 1;
    keys.forEach(key=>{
        key.classList.remove('active');
    });
    isPlay = false;
    console.log(barInfo);
};

const finish = (interval, difficulty)=>{
    if(isLastBarDisplayed){
        document.body.removeEventListener('keydown', keyDownHandler);
        document.body.removeEventListener('keyup', keyUpHandler);
        clearInterval(interval);
        
        console.log(gameBarOutcomes);
        gameBarOutcomes = [];
        let totalScore = calculateTotalPoints(barMetrics, difficulty);

        if(point < totalScore){
            incrementScore(totalScore);
        } else{
            displayScore();
        };
        resetGame();
    };
};


// Additional function
const checkBarPosition = (key, bar)=>{
    let type = typeOfSize().availableType;

    if(!bar.hasChildNodes()) return;

    const barChild = bar.children[0];
    const barChildBottom = barChild.getBoundingClientRect().bottom;
    const keyBottom = key.getBoundingClientRect().bottom;
    const heightKey = parseFloat(window.getComputedStyle(key, null).getPropertyValue('height'));

    const typeAndWeightArray = typeOfSize().typeAndWeightArray;

    if(barChildBottom >= keyBottom - (heightKey + heightKey * 0.1)){
        for(let i = 0; i < type.length; i++){
            const barChildHeight = parseFloat(window.getComputedStyle(barChild, null).getPropertyValue('height'));
            
            if(barChildBottom <= keyBottom && Math.floor(barChildHeight) === Math.floor(typeAndWeightArray[i][type[i]])){
                setBarTypeAndHeight(barChild);
                barChild.style.opacity = 1;
                barChild.classList.add('get-it');
                point++;
                scoreDisplayElement.innerHTML = point;
            };
        };
    };
};

const setBarTypeAndHeight = (bar)=>{
    if(!bar.classList.contains('Type-1')){
        barMetrics[checkTheBarNumber(bar)]['isReallyGetIt'] = true;
        barMetrics[checkTheBarNumber(bar)]['currentPosition'] = bar.getBoundingClientRect().bottom;

        for(let i = 1; i <= typeOfSize().availableType.length; i++){
            if(bar.classList.contains(`Type-${i}`)){
                barMetrics[checkTheBarNumber(bar)][`Type-${i}`] = parseFloat(window.getComputedStyle(bar, null).getPropertyValue('height'));
            };
        };
        barMetrics[checkTheBarNumber(bar)]['firstHeight'] = parseFloat(window.getComputedStyle(bar, null).getPropertyValue('height'));
    } else{
        barMetrics[checkTheBarNumber(bar)]['Type-1'] = parseFloat(window.getComputedStyle(bar, null).getPropertyValue('height'));
    };
};

const setBarEndPositionAndLastHeight = (bar)=>{
    let barChild = bar.children[0];
    if(bar.hasChildNodes() && barMetrics[checkTheBarNumber(barChild)]['isReallyGetIt']){
        barMetrics[checkTheBarNumber(barChild)]['endPosition'] = barChild.getBoundingClientRect().bottom;
        barMetrics[checkTheBarNumber(barChild)]['lastHeight'] = parseFloat(window.getComputedStyle(barChild, null).getPropertyValue('height'));
    } else{
        verifyBarMetrics(barMetrics);
    };
};

const checkTheBarNumber = (bar)=>{
    for(let i = 1; i <= gameBarCount; i++){
        if(bar.classList.contains(`bar-number-${i}`)) return `bar-number-${i}`;
    };
};

const verifyBarMetrics = (obj)=>{
    for(let barDown in obj){
        if(obj[barDown]['isReallyGetIt'] && !obj[barDown].hasOwnProperty('Type-1') && (!obj[barDown].hasOwnProperty('endPosition') || !obj[barDown].hasOwnProperty('lastHeight'))){
            obj[barDown]['endPosition'] = keys[0].getBoundingClientRect().bottom;
            obj[barDown]['lastHeight'] = 0;
        };
    };
};

const weightedRandomSelection = (arr)=>{
    let totalWeight = arr.reduce((acc, el) => acc + el.weight, 0);
    let randomNum = Math.random() * totalWeight;
    let weightSum = 0;

    for(let i = 0; i < arr.length; i++){
        weightSum += arr[i].weight;

        if(randomNum < weightSum){
            return arr[i];
        };
    };
};

const highlightMissedBars = (obj, elem)=>{
    for(let i = 1; i <= gameBarCount; i++){
        if(elem.classList.contains(`bar-number-${i}`) && !obj[`bar-number-${i}`].hasOwnProperty('Type-1') && !obj[`bar-number-${i}`].hasOwnProperty('isReallyGetIt')){
            elem.style.backgroundColor = 'black';
        };
    };
};

function pending(s){
    return new Promise(resolve=>{
        setTimeout(resolve, s);
    });
};


// Apply Event Listener
window.addEventListener('keydown', pause);
window.addEventListener('keydown', giveInstruction);
window.addEventListener('keydown', chooseDifficulty);
window.addEventListener('keydown', startWithSpace);