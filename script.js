class Tag_map {
    constructor(stop_id, label, longitude, latitude) {
        this.stop_id = stop_id
        this.label = label
        this.longitude = longitude
        this.latitude = latitude
    }
}

async function loadStops() {
    let url = "https://tosamara.ru/api/v2/classifiers/stopsFullDB.xml";
    try {
        let res = await fetch(url).then(response => response.text()).then(str => {
            let parser = new window.DOMParser();
            return parser.parseFromString(str, "text/xml")
        });
        return res;
    }
    catch (err) { console.log('err:', err); }
}

async function getInformationForMarks() {
    const data = await loadStops();
    console.log(data);
    let size = data.getElementsByTagName("stop").length;
    let stop_data = data.getElementsByTagName("stop");
    let lst = new Array();

    for (let i = 0; i < size; i++) {
        lst.push(new Tag_map(stop_data[i].childNodes[0].textContent,
            stop_data[i].childNodes[1].textContent + '\r\n'
            + stop_data[i].childNodes[2].textContent + '\n'
            + stop_data[i].childNodes[3].textContent,
            stop_data[i].childNodes[24].textContent,
            stop_data[i].childNodes[23].textContent));
    }

    console.log(lst)
    if (lst.size === 0) {
      lst = "No Matches";
    }
    LOADED_STOPS = lst;
    return await Promise.resolve(lst);
}

async function TransportRoute(hullNo, ListStops) {
    getInformationForMarks().then(async (stops) => {
        let URL = `https://tosamara.ru/api/v2/xml?method=getTransportPosition&HULLNO=${hullNo}&os=android&clientid=test&authkey=${sha1(hullNo + "just_f0r_tests")}`
        let res = await fetch(URL)
            .then(response => response.text()).then(str => {
                let parser = new window.DOMParser();
                return parser.parseFromString(str, "text/xml");
            });
        let innerElement = [];
        let KS_ID = 0;
        res = res.getElementsByTagName("nextStops")[0].getElementsByTagName("stop");
        for (let i = 0; i < res.length; i++) {
            KS_ID = res[i].getElementsByTagName("KS_ID")[0].textContent;

            // for (let j = 0; j < stops.length; j++) {
            //     if(stops[j].stop_id === KS_ID) {
            //         innerElement.push(`<a href="#" onclick="showStopInfo('${stops[j].stop_id}', '${stops[j].label}')">${stops[j].label}</a>  +  ${Math.ceil(res[i].getElementsByTagName("time")[0].textContent / 60)} минут(ы)<br/>`);
            //         break;
            //     }
            // }я не знаю почему onclick не работает и исползов ниже код
            //
            for (let j = 0; j < stops.length; j++) {
                if (stops[j].stop_id === KS_ID) {
                    const uniqueId = `stop-link-${stops[j].stop_id}`;
                    innerElement.push(`<a href="#" id="${uniqueId}">${stops[j].label}</a> + ${Math.ceil(res[i].getElementsByTagName("time")[0].textContent / 60)} минут(ы)<br/>`);
                    setTimeout(() => {
                        const linkElement = document.getElementById(uniqueId);
                        if (linkElement) {
                            linkElement.addEventListener('click', function(event) {
                                event.preventDefault();
                                showStopInfo(stops[j].stop_id, stops[j].label);
                            });
                        }
                    }, 0);
            
                    break;
                }
            }
            //
        }
        if (innerElement.length === 0)
            innerElement = "<h3>Остановки отсутствуют</h3>";
        ListStops.innerHTML = innerElement.join('');
    });
}

async function transportStop(stopID, ListTransport) {
    let URL = `https://tosamara.ru/api/v2/xml?method=getFirstArrivalToStop&KS_ID=${stopID}&os=android&clientid=test&authkey=${sha1(stopID + "just_f0r_tests")}`
    let res = await fetch(URL)
        .then(response => response.text()).then(str => {
            let parser = new window.DOMParser();
            return parser.parseFromString(str, "text/xml");
        });
    console.log(res);
    let innerElement = "";
    res = res.getElementsByTagName("transport");
    for (let i = 0; i < res.length; i++) {
        innerElement += `<a href="#" onclick="showTransportRoute('${res[i].getElementsByTagName("hullNo")[0].childNodes[0].nodeValue}', '${res[i].getElementsByTagName("number")[0].childNodes[0].nodeValue} ${res[i].getElementsByTagName("type")[0].childNodes[0].nodeValue}')">` +
                        `${res[i].getElementsByTagName("number")[0].childNodes[0].nodeValue} ${res[i].getElementsByTagName("type")[0].childNodes[0].nodeValue}</a>`  +
                        `${res[i].getElementsByTagName("time")[0].childNodes[0].nodeValue} Минут<br/>`;
    }
    if (innerElement.length === 0)
        innerElement = "<h3>Транспорт отсутствует</h3>";
    ListTransport.innerHTML = innerElement;
}

function showStopInfo(stopId, label) {
    document.getElementById('name').textContent = label;
    transportStop(stopId, document.getElementById('transport-list'));
    document.getElementById('map').style.display = 'none';
    document.getElementById('stop-section').style.display = 'block';
}

function showTransportRoute(hullNo, name) {
    document.getElementById('transport-name').textContent = name;
    TransportRoute(hullNo, document.getElementById('stops-list'));
    document.getElementById('map').style.display = 'none';
    document.getElementById('stop-section').style.display = 'none';
    document.getElementById('stops-route-transport-section').style.display = 'block';
}

function returnToMap() {
    document.getElementById('map').style.display = 'block';
    document.getElementById('stop-section').style.display = 'none';
    document.getElementById('stops-route-transport-section').style.display = 'none';
}

class TransportArrivalStop
{
    constructor(type, number, KR_ID, time)
    {
        this.type = type
        this.number = number
        this.KR_ID = KR_ID
        this.time = time
    }
}

async function loadTransportArrivalStop(stopID) {
    let url = `https://tosamara.ru/api/v2/xml?method=getFirstArrivalToStop&KS_ID=${stopID}&os=android&clientid=test&authkey=${sha1(stopID+"just_f0r_tests")}`;
    try {
        let res = await fetch(url).then(response => response.text()).then(str => {
            let parser = new window.DOMParser();
            return parser.parseFromString(str, "text/xml")
        });
        console.log(res)
        return res;
    }
    catch (err) { console.log('err:', err); }
}

function filterFunction() {
    var input, filter, a, i;
    loadDataInput(LOADED_STOPS, ListInputElement);
    input = document.getElementById("search_text");
    filter = input.value.toUpperCase();
    div = document.getElementById("input-list");
    a = div.getElementsByTagName("a");
    for (i = 0; i < a.length; i++) {
            txtValue = a[i].textContent || a[i].innerText;
            if (txtValue.toUpperCase().indexOf(filter) > -1) {
                a[i].style.display = "";
            } else {
                a[i].style.display = "none";
        }
    }
}

function loadDataInput(data, element) {
    if(data) {
        let innerElement = "";
        let stops_data = data.getElementsByTagName("stop");
        for(let i = 0; i < stops_data.length; i++) {
            try {
                innerElement += `<a href="#" onclick="showStopInfo('${stops_data[i].getElementsByTagName("KS_ID")[0].childNodes[0].nodeValue}', '${stops_data[i].getElementsByTagName("title")[0].childNodes[0].nodeValue}')">` +
                                `${stops_data[i].getElementsByTagName("title")[0].childNodes[0].nodeValue}<br/> ${stops_data[i].getElementsByTagName("direction")[0].childNodes[0].nodeValue}<br/><hr/></a>`;
            } catch(err) {
                innerElement += `<a href="#" onclick="showStopInfo('${stops_data[i].getElementsByTagName("KS_ID")[0].childNodes[0].nodeValue}', '${stops_data[i].getElementsByTagName("title")[0].childNodes[0].nodeValue}')">` +
                                `${stops_data[i].getElementsByTagName("title")[0].childNodes[0].nodeValue}<br/></a>`;
            }
        }
        element.innerHTML = innerElement;
    }
}

async function searchstop() {
    const data = await loadStops();
    console.log(data);
    let size = data.getElementsByTagName("stop").length;
    let stop_data = data.getElementsByTagName("stop");
    let lst = new Array();

    for (let i = 0; i < size; i++) {
        lst.push(new Tag_map(
            stop_data[i].childNodes[0].textContent,
            stop_data[i].childNodes[1].textContent + stop_data[i].childNodes[2].textContent + stop_data[i].childNodes[3].textContent,
            stop_data[i].childNodes[24].textContent,
            stop_data[i].childNodes[23].textContent));
    }
    let input = document.getElementById("myInput").value;
    for (let i = 0; i < lst.length; i++) {
        if(input === lst[i].label) {
            // Gọi hàm để hiển thị thông tin điểm dừng
            showStopInfo(lst[i].stop_id, lst[i].label);
            break;
        }
    }
}

function autocomplete(inp) {
    var currentFocus;
    let stop = []
    getInformationForMarks().then((stops) => 
        {
            for (let i = 0; i < stops.length; i++) {
                stop.push(stops[i].label)
            }
        });
    inp.addEventListener("input", function(e) {
        var a, b, i, val = this.value;
        closeAllLists();
        if (!val) { return false;}
        currentFocus = -1;
        a = document.createElement("DIV");
        a.setAttribute("id", this.id + "autocomplete-list");
        a.setAttribute("class", "autocomplete-items");
        this.parentNode.appendChild(a);
        for (i = 0; i < stop.length; i++) {
          if (stop[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
            b = document.createElement("DIV");
            b.innerHTML = "<strong>" + stop[i].substr(0, val.length) + "</strong>";
            b.innerHTML += stop[i].substr(val.length);
            b.innerHTML += "<input type='hidden' value='" + stop[i] + "'>";
                b.addEventListener("click", function(e) {
                inp.value = this.getElementsByTagName("input")[0].value;
                closeAllLists();
            });
            a.appendChild(b);
          }
        }
    });
    inp.addEventListener("keydown", function(e) {
        var x = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");
        if (e.keyCode == 40) {
          currentFocus++;
          addActive(x);
        } else if (e.keyCode == 38) { 
          currentFocus--;
          addActive(x);
        } else if (e.keyCode == 13) {
          e.preventDefault();
          if (currentFocus > -1) {
            if (x) x[currentFocus].click();
          }
        }
    });
    function addActive(x) {
      if (!x) return false;
      removeActive(x);
      if (currentFocus >= x.length) currentFocus = 0;
      if (currentFocus < 0) currentFocus = (x.length - 1);
      x[currentFocus].classList.add("autocomplete-active");
    }
    function removeActive(x) {
      for (var i = 0; i < x.length; i++) {
        x[i].classList.remove("autocomplete-active");
      }
    }
    function closeAllLists(elmnt) {
      var x = document.getElementsByClassName("autocomplete-items");
      for (var i = 0; i < x.length; i++) {
        if (elmnt != x[i] && elmnt != inp) {
        x[i].parentNode.removeChild(x[i]);
      }
    }
  }
  document.addEventListener("click", function (e) {
      closeAllLists(e.target);
  });
  }