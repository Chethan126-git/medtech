// ---------- Navigation ----------
document.getElementById('nextBtn').addEventListener('click', () => {
    document.getElementById('welcomeScreen').style.display='none';
    document.getElementById('categoryScreen').style.display='flex';
});

function showSubMenu(menu){
    if(menu==='reminder'){
        document.getElementById('categoryScreen').style.display='none';
        document.getElementById('reminderMenu').style.display='flex';
    } else if(menu==='scan'){
        document.getElementById('categoryScreen').style.display='none';
        document.getElementById('scanPrescription').style.display='flex';
    }
}

function backToCategories(){
    document.getElementById('reminderMenu').style.display='none';
    document.getElementById('categoryScreen').style.display='flex';
}

function backToCategoriesFromScan(){
    document.getElementById('scanPrescription').style.display='none';
    document.getElementById('categoryScreen').style.display='flex';
}

function showMedicineReminder(){
    document.getElementById('reminderMenu').style.display='none';
    document.getElementById('medicineReminder').style.display='flex';
}

function backToReminderMenu(){
    document.getElementById('medicineReminder').style.display='none';
    document.getElementById('reminderMenu').style.display='flex';
}

// ---------- Medicine Reminder ----------
let medicines = [];
let speakingInterval = null;

document.getElementById('addMedicineBtn').addEventListener('click', addMedicine);
function addMedicine(){
    const nameInput=document.getElementById("name");
    const doseInput=document.getElementById("dose");
    const timeInput=document.getElementById("time");
    const imageInput=document.getElementById("imageUpload");

    const name=nameInput.value.trim().toLowerCase();
    const dose=doseInput.value.trim();
    const time=timeInput.value;

    if(name===""||dose===""||time===""){ alert("Fill all details"); return; }
    if(imageInput.files.length===0){ alert("Please upload medicine image"); return; }

    const imageURL=URL.createObjectURL(imageInput.files[0]);
    medicines.push({name,dose,time,image:imageURL,reminded:false});
    document.getElementById("status").innerText="Reminder Added Successfully ✅";
    nameInput.value=""; doseInput.value=""; timeInput.value=""; imageInput.value="";
}

setInterval(checkReminder,1000);
function checkReminder(){
    const now=new Date();
    const currentTime=String(now.getHours()).padStart(2,'0')+":"+String(now.getMinutes()).padStart(2,'0');
    medicines.forEach(med => { if(med.time===currentTime && !med.reminded){ med.reminded=true; startVoiceReminder(med); }});
}

function startVoiceReminder(med){
    function speak(){
        window.speechSynthesis.cancel();
        const speech=new SpeechSynthesisUtterance("Reminder. Please take "+med.name+". Take "+med.dose+" now.");
        speech.lang="en-IN"; speech.rate=1; speech.pitch=1;
        window.speechSynthesis.speak(speech);
    }
    speak();
    speakingInterval=setInterval(speak,10000);

    setTimeout(()=>{
        const userConfirmed=confirm("Medicine Reminder\n\nMedicine: "+med.name+"\nDose: "+med.dose+"\n\nPress OK after taking medicine.");
        if(userConfirmed){ clearInterval(speakingInterval); window.speechSynthesis.cancel(); showMedicineImage(med); }
    },4000);
}

function showMedicineImage(med){
    const box=document.getElementById("reminderImage");
    box.innerHTML="<h2>"+med.name.toUpperCase()+"</h2><img src='"+med.image+"'><p><b>Dose:</b> "+med.dose+"</p>";
}

// ---------- Scan Prescription ----------
let rawText=""; let doctorName=""; let scannedMeds=[];
function scanText(){
    let file=document.getElementById("upload").files[0];
    if(!file){ alert("Please upload a prescription image first"); return; }
    document.getElementById("result").innerText="🔍 Scanning...";
    Tesseract.recognize(file,'eng',{logger:m=>console.log(m)})
        .then(({data:{text}})=>{ rawText=text; processText(text); });
}

function processText(text){
    let lines=text.split("\n");
    scannedMeds=[]; doctorName="";
    lines.forEach(line=>{
        let clean=line.trim();
        if(/dr\.|md|clinic/i.test(clean)){ if(!doctorName.includes(clean)) doctorName+=clean+" | "; }
        if(/(tab|tablet|cap|capsule|syrup|mg|ml)/i.test(clean)){ if(!scannedMeds.includes(clean)) scannedMeds.push(clean); }
    });
    if(doctorName.endsWith(" | ")) doctorName=doctorName.slice(0,-3);
    displayResult();
}

function displayResult(){
    let output="👨‍⚕️ Doctor(s): "+(doctorName||"Not found")+"\n\n💊 Medicines:\n";
    if(scannedMeds.length===0) output+="No medicines detected"; else scannedMeds.forEach((med,i)=>{ output+=(i+1)+". "+med+"\n"; });
    document.getElementById("result").innerText=output;
}

function saveData(){
    if(scannedMeds.length===0){ alert("No medicines to save"); return; }
    let data={doctors:doctorName,medicines:scannedMeds,timestamp:new Date().toLocaleString()};
    localStorage.setItem("prescriptionData",JSON.stringify(data));
    alert("✅ Prescription saved successfully!");
}

function saveReminder(){
    const date=document.getElementById("nextCheckup").value;
    if(!date){ alert("Select a date first"); return; }
    localStorage.setItem("nextCheckupDate",date);
    document.getElementById("savedReminder").innerText=`📅 Next checkup date saved: ${date}`;
    const today=new Date().toISOString().slice(0,10);
    if(date===today) alert("⚠️ Your checkup is today!");
}

window.onload=()=>{
    const savedDate=localStorage.getItem("nextCheckupDate");
    if(savedDate){
        document.getElementById("savedReminder").innerText=`📅 Next checkup date: ${savedDate}`;
        document.getElementById("nextCheckup").value=savedDate;
    }
};