const fileCounts = { mmlu: 280, hellaswag: 200, arc: 23, truthfulqa: 16, race: 69, mathqa: 656};
let currData = [];
let currQuestion = 0;
let score = 0;
let currCategoryName ="";

function getQuestions(categoryName){

    currCategoryName = categoryName;
    currQuestion = 0;
    score = 0;
    const randNum = Math.floor(Math.random() * fileCounts[categoryName]);

    const url = `./data/${categoryName}/${randNum}.json`;
    fetch(url)
    .then(response => response.json())
    .then( data => {
        currData = data;
        openModelPopup(categoryName, data);

    })
    .catch( error => {
        console.log("error fetching file", error);
    });
}
//first clean data based on category 
// create question cards
function openModelPopup(categoryName, data){

    currQuestion = 0;
    score = 0;

    document.getElementById('quiz-modal').classList.remove('hidden');
    //heading 
    document.getElementById('modal-category-title').innerText = categoryName.charAt(0).toUpperCase() + categoryName.slice(1) + " Quiz";

    loadQuestion();
}

function closeModal(){
    document.getElementById('quiz-modal').classList.add('hidden');
}

function loadQuestion(){

    if(currQuestion >= 1){
        document.getElementById('finish-btn').disabled = false;
    }

    const questionData = currData[currQuestion];
    document.getElementById('question-counter').innerText = `Question ${currQuestion + 1} / 50`;

    const percent = ((currQuestion + 1)  * 10);
    //document.getElementById('progress-fill').style.width = `${percent}%`;

    document.getElementById('question-text').innerText = questionData.question;

    document.getElementById('options-container').innerHTML = "";
    
    questionData.options.forEach((element, i) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = element;
        
        btn.onclick = () => checkAnswer(i, btn, questionData.answer);
        
        document.getElementById('options-container').appendChild(btn);
    });
    document.getElementById('next-btn').disabled = true;
    
}

function checkAnswer(i, btn, answer){
    
    const allbtn = document.querySelectorAll('.option-btn');
    allbtn.forEach(e => e.disabled = true);

    if( i === answer){
        btn.classList.add('correct');
        score++;
    }else{
        btn.classList.add('wrong');
        allbtn[answer].classList.add('correct');
    }

    document.getElementById('next-btn').disabled = false;
}

function nextQuestion(){
    if (currQuestion < 49){
        currQuestion++;
        loadQuestion();
    }else{
        //alert(` You scored ${score} / 10`);
        closeModal();
        showchart();
    }
}

function finish(){
    closeModal();
    showchart();
}

async function showchart() {
    
    const chartc = document.getElementById('chart-model');
    chartc.classList.remove('hidden');

    const userPercentage = (score / 10) * 100;

    let dataPoints = [];

    try {
        const allresult = await getchartData();
        const benchmark = allresult[currCategoryName];
        if(benchmark) {
            for (let i = 0; i < benchmark.labels.length; i++) {
                if (benchmark.labels[i] === "You") continue; 

                dataPoints.push({
                    label: benchmark.labels[i],
                    y: benchmark.scores[i],
                    color: "#cbd5e1" 
                });
            }
        }
    } catch (e) {
        console.log("Could not load benchmark data, showing defaults.");
        dataPoints = [
            { label: "Average Human", y: 50, color: "#cbd5e1" },
            { label: "GPT-4", y: 85, color: "#cbd5e1" }
        ];
    }

    dataPoints.push({
        label: "YOU",
        y: userPercentage,
        color: "#2563eb", 
        indexLabel: "Your Score" 
    });

    var chart = new CanvasJS.Chart("chart-body", {
        animationEnabled: true,
        theme: "light2",
        title: {
            text: `Results: ${currCategoryName.toUpperCase()}`
        },
        axisY: {
            title: "Score (%)",
            maximum: 100
        },
        data: [{
            type: "column",
            yValueFormatString: "#,##0.0'%'",
            dataPoints: dataPoints
        }]
    });
    
    chart.render();
}

function closeChart(){
    document.getElementById('chart-model').classList.add('hidden');
}

async function getchartData(){

    const response = await fetch("./data/models.json");
    if (!response.ok) {
        throw new Error("error while fetching models.json");
    }
    return await response.json();
}
