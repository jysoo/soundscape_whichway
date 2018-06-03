import { Component, OnInit } from "@angular/core";
import { Location, getCurrentLocation, isEnabled, distance, enableLocationRequest } from "nativescript-geolocation";
import { Accuracy } from "ui/enums";
import { HttpService } from "../../http.service";
import { MessageService } from "../../message.service";
import { ListPicker } from "ui/list-picker";

@Component({
    selector: "Home",
    moduleId: module.id,
    templateUrl: "./home.component.html",
    providers: [HttpService]
})

export class HomeComponent implements OnInit {
    public desc = "\n\nThis feature aims to complement Soundscape’s existing features. For each path near you, find out which points of interest(POIs) lie along that particular path. Probably most useful when approaching intersections. Set certain POIs as beacons or reference points on Soundscape to learn about their position relative to yourself.\n\n\n"
    public instr = "Select desired location.\nResults can be accessed via the POI tab at the bottom."
    public nl = "\n";

    public computeStatus;

    public locationList = ["Thurloe Place", "Seven Dials", "Current Location"];
    public dictCoord = { "Thurloe Place": [51.4951825, -0.1734479], "Seven Dials": [51.5136843, -0.1270910]};
    public picked: string;

    public coordinate; //[lat,lon]

    public overpassGetPreUrl = "http://overpass-api.de/api/interpreter?data=";

    public overpassUrl = "http://overpass-api.de/api/interpreter";

    //public tokenUrl = "https://westus.api.cognitive.microsoft.com/sts/v1.0/issueToken";
    //public synUrl = "https://westus.tts.speech.microsoft.com/cognitiveservices/v1";
    //public synUrl = "https://westus.api.cognitive.microsoft.com/sts/v1.0";
    //public synUrl = "http://speech.platform.bing.com/synthesize";

    public listPathsPOIs  = [];

    public listText = [];

    public _subscriptionCS;


    constructor(private httpService: HttpService, private messageService: MessageService) {
        enableLocationRequest(true);
        this.computeStatus = messageService.computeStatus;
        this._subscriptionCS = messageService.computeStatusSource.subscribe((status) => { 
            this.computeStatus = status; 
        });
    }

    ngOnInit(): void {
        this.isLocationEnabled();
    }

    async selectedIndexChanged(args) {
        let picker = <ListPicker>args.object;
        console.log("Picked " + this.locationList[picker.selectedIndex]);
        if (this.locationList[picker.selectedIndex] == "Current Location") {
            this.coordinate =  await this.refreshCurrentPosition();
        } else {
            this.coordinate = this.dictCoord[this.locationList[picker.selectedIndex]];
        }
        
    }

    public isLocationEnabled() {
        isEnabled().then(function (isLocationEnabled) {
            let message = "Location services are not available";
            if (isLocationEnabled) {
                message = "Location services are available";
            }
            alert(message);
        }, function (error) {
            console.log("Location error: " + (error.message || error));
            alert("Location error: " + (error.message || error));
        });
    }

    public refreshCurrentPosition() {

        return getCurrentLocation({
            desiredAccuracy: Accuracy.high,
            timeout: 5000
        })
            .then(location => {
                console.log("Location received: " + location.latitude + " " + location.longitude);
                return [location.latitude, location.longitude];
            }).catch(error => {
                console.log("Error getting current location: " + (error.message || error));
                alert("Error getting current location: " + (error.message || error));
                return error;
            });
    }

    public computePathsPOIs(): void {
        console.log("start");
        this.messageService.updateComputeStatus("Computing POIs for each path near you...");
        this.messageService.updateListPathPOIText([""]);
        //console.log(this.coordinate);
        let queryGetListPaths = '[out:json][timeout:50];way(around:18,' + this.coordinate[0] + ',' + this.coordinate[1] + ')[area!~"yes"][highway~"."][highway!~"motorway|motorway_link|trunk|trunk_link|cycleway|crossing|footway"][sidewalk!~"no|none"];(._;>;);out;';
        //console.log(queryGetListPaths);
        //let that = this;
        this.httpService.postData(encodeURI(this.overpassUrl), queryGetListPaths) //post enables longer query than get
            .subscribe(async(response) => {
                //console.log("success");
                //console.log(JSON.stringify(response['elements']));
                let listWays = response['elements'].filter(item => item.type == "way");
                let listPaths = this.createListPaths(listWays);
                let listNodes = response['elements'].filter(item => item.type == "node");
                let dictNodes = this.createDictNodes(listNodes);
                //console.log(JSON.stringify(listPaths));
                if (!Array.isArray(listPaths) || !listPaths.length) {
                    // if does not exist, is not an array, or is empty
                    this.listText = ["No results to show."];
                    this.messageService.updateComputeStatus("No results to show.");
                } else {
                    let listPolygons = this.createListPolygons(listPaths, dictNodes);
                    this.listPathsPOIs = await this.getListPathsPOIs(listPolygons); // async/await
                    for (let i = 0; i < this.listPathsPOIs.length; i++) {
                        console.log(this.listPathsPOIs[i][0]);
                        console.log(JSON.stringify(this.listPathsPOIs[i][1]));
                    }
                    this.listText = this.createTextFromListPOIs(this.listPathsPOIs);
                    this.messageService.updateComputeStatus("Results are now ready.");
                    console.log(this.listText); 
                }
                this.messageService.updateListPathPOIText(this.listText);
            }, (error) => {
                this.messageService.updateComputeStatus("Error");
                console.log("Error getting paths near you: " + (error.message || error));
                alert("Error getting paths near you: " + (error.message || error));
            });
    }

    public createDictNodes(listNodes): Object {
        let dict = {};
        let numNodes = Object.keys(listNodes).length;
        for (let i = 0; i < numNodes; i++) {
            dict[listNodes[i].id] = [listNodes[i].lat, listNodes[i].lon];
        }
        return dict;
    }

    public createListPaths(listWays): Object {
        let list = []; 
        let numWays = Object.keys(listWays).length;
        for (let i = 0; i < numWays; i++) {
            list.push(listWays[i]);
        }
        return list;
    }

    public createListPolygons(listPaths, dictNodes): Object {
        let list = [];
        let r = 0.0003; // some distance away from road
        listPaths.forEach(element => {
            let num = element.nodes.length;
            let a = [];
            let b = [];
            let lat1 = 0.8 * dictNodes[element.nodes[0]][0] + 0.2 * dictNodes[element.nodes[1]][0]; // start a little further away
            let lon1 = 0.8 * dictNodes[element.nodes[0]][1] + 0.2 * dictNodes[element.nodes[1]][1];
            let lat2;
            let lon2;
            let first;
            let m;
            for (let i = 1; i < num; i++) {
                if (i == num - 1) { //last one // end a little inward
                    lat2 = 0.2 * dictNodes[element.nodes[0]][0] + 0.8 * dictNodes[element.nodes[i]][0];
                    lon2 = 0.2 * dictNodes[element.nodes[0]][1] + 0.8 * dictNodes[element.nodes[i]][1]; 
                } else {
                    lat2 = dictNodes[element.nodes[i]][0];
                    lon2 = dictNodes[element.nodes[i]][1];
                }
                m = 1 / ((lon2 - lon1) / (lat2 - lat1));
                let den = Math.sqrt(1 + Math.pow(m, 2));
                let c = 1 / den;
                let s = m / den;
                a = a.concat([lat1 - r * c, lon1 - r * s]);
                if (i == 1) {
                    first = [lat1 - r * c, lon1 - r * s];
                }
                b.push([lat1 + r * c, lon1 + r * s]);
                lat1 = lat2;
                lon1 = lon2;
            }
            let den = Math.sqrt(1 + Math.pow(m, 2));
            let c = 1 / den;
            let s = m / den;
            a = a.concat([lat1 - r * c, lon1 - r * s]);
            b.push([lat1 + r * c, lon1 + r * s]); //push as a pair because lat lon order needs to be preserved
            while (b.length != 0) {
                a = a.concat(b.pop()); // concat b list in reverse manner
            }
            a = a.concat(first);
            //console.log(a.join(' '));
            //console.log(element.tags.name);
            let name;
            if (element.tags.junction == 'roundabout') {
                name = element.tags.name + ' roundabout';   //indicate roundabout
            } else {
                name = element.tags.name;
            }
            list.push([a.join(' '), name]);
        });
        return list;
    }

    public getListPathsPOIs(listPolygons) {
        //return promise of list
        let that = this;
        let list;
        let promises = [];
        let num = listPolygons.length;
        const delay = new Promise(resolve => setTimeout(resolve, 200)); //set delay between http requests to avoid error 429
        promises.push(delay);
        for (let i = 0; i < num; i++) {
            createPromise(i);
        }
        return Promise.all(promises).then((values) => {
            let l = [];
            for (let i = 0; i < values.length; i++) {
                if (values[i] != undefined) {   //do not return promise results from delays.
                    l.push(values[i]);
                    //console.log(values[i][0]);
                    //console.log(JSON.stringify(values[i][1]));
                }
            }
            return l;
        }).catch(error => {
            this.messageService.updateComputeStatus("Error");
            console.log("Error getting POIs: " + (error.message || error));
            alert("Error getting POIs: " + (error.message || error));
            return [error.message];
        });

        function createPromise(i) {
                let poly = listPolygons[i][0];
                let name = listPolygons[i][1]; // if undefined, then output all
                let queryGetListPOIs;

                queryGetListPOIs = '[out:json][timeout:90];('
                    + '(node(poly:"' + poly + '")["amenity"];-node(poly:"' + poly + '")["amenity"]["addr:street"]["addr:street"!="' + name + '"];);'
                    + '(node(poly:"' + poly + '")["shop"];-node(poly:"' + poly + '")["shop"]["addr:street"]["addr:street"!="' + name + '"];);'
                    + '(node(poly:"' + poly + '")["tourism"];-node(poly:"' + poly + '")["tourism"]["addr:street"]["addr:street"!="' + name + '"];);'
                    + '(node(poly:"' + poly + '")["leisure"];-node(poly:"' + poly + '")["leisure"]["addr:street"]["addr:street"!="' + name + '"];);'
                    + '(node(poly:"' + poly + '")["historic"];-node(poly:"' + poly + '")["historic"]["addr:street"]["addr:street"!="' + name + '"];);'
                    + '(way(poly:"' + poly + '")["amenity"];-way(poly:"' + poly + '")["amenity"]["addr:street"]["addr:street"!="' + name + '"];);'
                    + '(way(poly:"' + poly + '")["shop"];-way(poly:"' + poly + '")["shop"]["addr:street"]["addr:street"!="' + name + '"];);'
                    + '(way(poly:"' + poly + '")["tourism"];-way(poly:"' + poly + '")["tourism"]["addr:street"]["addr:street"!="' + name + '"];);'
                    + '(way(poly:"' + poly + '")["leisure"];-way(poly:"' + poly + '")["leisure"]["addr:street"]["addr:street"!="' + name + '"];);'
                    + '(way(poly:"' + poly + '")["historic"];-way(poly:"' + poly + '")["historic"]["addr:street"]["addr:street"!="' + name + '"];);'
                    + '(relation(poly:"' + poly + '")["amenity"];-relation(poly:"' + poly + '")["amenity"]["addr:street"]["addr:street"!="' + name + '"];);'
                    + '(relation(poly:"' + poly + '")["shop"];-relation(poly:"' + poly + '")["shop"]["addr:street"]["addr:street"!="' + name + '"];);'
                    + '(relation(poly:"' + poly + '")["tourism"];-relation(poly:"' + poly + '")["tourism"]["addr:street"]["addr:street"!="' + name + '"];);'
                    + '(relation(poly:"' + poly + '")["leisure"];-relation(poly:"' + poly + '")["leisure"]["addr:street"]["addr:street"!="' + name + '"];);'
                    + '(relation(poly:"' + poly + '")["historic"];-relation(poly:"' + poly + '")["historic"]["addr:street"]["addr:street"!="' + name + '"];);'
                    + ');out;';
                //console.log(queryGetListPOIs);
                let promise = new Promise((resolve, reject) => {
                    that.httpService.postData(encodeURI(that.overpassUrl), queryGetListPOIs).subscribe((response) => {
                        resolve([name,response['elements']]);
                    }, (error) => {
                        console.log(name + ' ' + error.message);
                        reject(error);
                    });
                });
            promises.push(promise);
            promises.push(delay);          
        }
    }

    public createTextFromListPOIs(listPOI) {
        let list = [];
        listPOI.forEach((element) => {
            let str = new Set();            // prevent overlap/repeated poi data
            //console.log(element[0]);
            //console.log(JSON.stringify(element[1]));
            element[1].forEach((poi) => {  //process and clean up tag names and description
                let p = '';
                if (poi.tags != undefined) {
                    if (poi.tags.amenity != undefined) {
                        p += 'amenity, ';
                        if (poi.tags.cuisine != undefined) {
                            if (poi.tags.cuisine.includes('_')) {
                                p += poi.tags.cuisine.split('_').join(' ') + ' ';
                            } else {
                                p += poi.tags.cuisine + ' ';
                            } 
                        }
                        if (poi.tags.amenity.includes('_')) {
                            p += poi.tags.amenity.split('_').join(' ');
                        } else {
                            p += poi.tags.amenity;
                        }  
                        if (poi.tags.name != undefined) {
                            p += ', ' + poi.tags.name;
                        }
                    } else if (poi.tags.shop != undefined) {
                        if (poi.tags.shop.includes('_')) {
                            p += poi.tags.shop.split('_').join(' ');
                        } else {
                            p += poi.tags.shop;
                        }  
                        p += ' shop';
                        if (poi.tags.name != undefined) {
                            p += ', ' + poi.tags.name;
                        }
                    } else if (poi.tags.tourism != undefined) {
                        p += 'tourism, ';
                        if (poi.tags.tourism.includes('_')) {
                            p += poi.tags.tourism.split('_').join(' ');
                        } else {
                            p += poi.tags.tourism;
                        }  
                        if (poi.tags.name != undefined) {
                            p += ', ' + poi.tags.name; 
                        }
                    } else if (poi.tags.leisure != undefined) {
                        p += 'leisure, ';
                        if (poi.tags.leisure.includes('_')) {
                            p += poi.tags.leisure.split('_').join(' ');
                        } else {
                            p += poi.tags.leisure;
                        }  
                        if (poi.tags.name != undefined) {
                            p += ', ' + poi.tags.name;
                        }
                    } else if (poi.tags.historic != undefined) {
                        p += 'historic, ';
                        if (poi.tags.historic.includes('_')) {
                            p += poi.tags.historic.split('_').join(' ');
                        } else {
                            p += poi.tags.historic;
                        }  
                        if (poi.tags.name != undefined) {
                            p += ', ' + poi.tags.name; 
                        }
                    }
                }
                str.add(p);
            });
            //console.log(element[0] + ': ' + str.join("; ") + '. ');
            list.push(element[0] + ': ' + Array.from(str).join("; ") + '. '); // joining is more efficient than concatenation
        });
        return list;
    }

    ngOnDestroy() {
        // prevent memory leak
        this._subscriptionCS.unsubscribe();
    }

    /* Microsoft Cognitive Services responded with 
    <h2>Our services aren't available right now</h2><p>We're working to restore all services as soon as possible. Please check back soon.</p>Ref A: 19D528D6015B46C4ABCD0FC8B8A99C4D Ref B: LON04EDGE0411 Ref C: 2018-05-31T21:24:10Z
    
    // use typical javascript xmlhttpreq because of angular bug with application/x-www-urlencoded type
        let headers = { "Ocp-Apim-Subscription-Key": "e89b37fbcda544959db826715a13a01b",
                        "Content-type": "application/x-www-form-urlencoded",
                        "Content-Length": "0"};

        this.httpService.xhr('POST', this.tokenUrl, null, headers)
            .then((res) => {
                let h = {
                    "Content-Type": "application/ssml+xml",
                        "X-Microsoft-OutputFormat": "riff-24khz-16bit-mono-pcm",
                            "Authorization": "Bearer " + res,
                                        "User-Agent": "TTS"
                };
                console.log(res);
                //console.log(this.listText[0]);
                //console.log()
                //let test = "Berners Street: outdoor shop, Kathmandu; tourism, attraction, Soho; historic, roman_road, ROMAN ROAD - Devil's Highway.";
                let test = "<speak version='1.0' xmlns = 'http://www.w3.org/2001/10/synthesis' xml: lang = 'en-US' ><voice  name='Microsoft Server Speech Text to Speech Voice (en-US, JessaRUS)' >Hello, world!< /voice> </speak >";
                //let test = "<speak version='1.0' xml: lang = 'en-US' > <voice xml: lang = 'en-US' xml: gender = 'Female' name = 'Microsoft Server Speech Text to Speech Voice (en-US, ZiraRUS)' > Microsoft Bing Voice Output API < /voice></speak >";
                this.httpService.xhr('POST', this.synUrl, test, h)
                    .then((r) => {
                        console.log('audio ' + r);
                    }).catch(function (error) {
                        console.log('Error: ', error.status, error.statusText);
                    });
            }).catch(function (error) {
                console.log('Error: ', error.status, error.statusText);
            });*/
}
