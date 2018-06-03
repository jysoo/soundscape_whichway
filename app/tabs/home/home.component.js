"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var nativescript_geolocation_1 = require("nativescript-geolocation");
var enums_1 = require("ui/enums");
var http_service_1 = require("../../http.service");
var message_service_1 = require("../../message.service");
var HomeComponent = /** @class */ (function () {
    function HomeComponent(httpService, messageService) {
        var _this = this;
        this.httpService = httpService;
        this.messageService = messageService;
        this.desc = "\n\nThis feature aims to complement Soundscape’s existing features. For each path near you, find out which points of interest(POIs) lie along that particular path. Probably most useful when approaching intersections. Set certain POIs as beacons or reference points on Soundscape to learn about their position relative to yourself.\n\n\n";
        this.instr = "Select desired location.\nResults can be accessed via the POI tab at the bottom.";
        this.nl = "\n";
        this.locationList = ["Thurloe Place", "Seven Dials", "Current Location"];
        this.dictCoord = { "Thurloe Place": [51.4951825, -0.1734479], "Seven Dials": [51.5136843, -0.1270910] };
        this.overpassGetPreUrl = "http://overpass-api.de/api/interpreter?data=";
        this.overpassUrl = "http://overpass-api.de/api/interpreter";
        //public tokenUrl = "https://westus.api.cognitive.microsoft.com/sts/v1.0/issueToken";
        //public synUrl = "https://westus.tts.speech.microsoft.com/cognitiveservices/v1";
        //public synUrl = "https://westus.api.cognitive.microsoft.com/sts/v1.0";
        //public synUrl = "http://speech.platform.bing.com/synthesize";
        this.listPathsPOIs = [];
        this.listText = [];
        nativescript_geolocation_1.enableLocationRequest(true);
        this.computeStatus = messageService.computeStatus;
        this._subscriptionCS = messageService.computeStatusSource.subscribe(function (status) {
            _this.computeStatus = status;
        });
    }
    HomeComponent.prototype.ngOnInit = function () {
        this.isLocationEnabled();
    };
    HomeComponent.prototype.selectedIndexChanged = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var picker, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        picker = args.object;
                        console.log("Picked " + this.locationList[picker.selectedIndex]);
                        if (!(this.locationList[picker.selectedIndex] == "Current Location")) return [3 /*break*/, 2];
                        _a = this;
                        return [4 /*yield*/, this.refreshCurrentPosition()];
                    case 1:
                        _a.coordinate = _b.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        this.coordinate = this.dictCoord[this.locationList[picker.selectedIndex]];
                        _b.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    HomeComponent.prototype.isLocationEnabled = function () {
        nativescript_geolocation_1.isEnabled().then(function (isLocationEnabled) {
            var message = "Location services are not available";
            if (isLocationEnabled) {
                message = "Location services are available";
            }
            alert(message);
        }, function (error) {
            console.log("Location error: " + (error.message || error));
            alert("Location error: " + (error.message || error));
        });
    };
    HomeComponent.prototype.refreshCurrentPosition = function () {
        return nativescript_geolocation_1.getCurrentLocation({
            desiredAccuracy: enums_1.Accuracy.high,
            timeout: 5000
        })
            .then(function (location) {
            console.log("Location received: " + location.latitude + " " + location.longitude);
            return [location.latitude, location.longitude];
        }).catch(function (error) {
            console.log("Error getting current location: " + (error.message || error));
            alert("Error getting current location: " + (error.message || error));
            return error;
        });
    };
    HomeComponent.prototype.computePathsPOIs = function () {
        var _this = this;
        console.log("start");
        this.messageService.updateComputeStatus("Computing POIs for each path near you...");
        this.messageService.updateListPathPOIText([""]);
        //console.log(this.coordinate);
        var queryGetListPaths = '[out:json][timeout:50];way(around:18,' + this.coordinate[0] + ',' + this.coordinate[1] + ')[area!~"yes"][highway~"."][highway!~"motorway|motorway_link|trunk|trunk_link|cycleway|crossing|footway"][sidewalk!~"no|none"];(._;>;);out;';
        //console.log(queryGetListPaths);
        //let that = this;
        this.httpService.postData(encodeURI(this.overpassUrl), queryGetListPaths) //post enables longer query than get
            .subscribe(function (response) { return __awaiter(_this, void 0, void 0, function () {
            var listWays, listPaths, listNodes, dictNodes, listPolygons, _a, i;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        listWays = response['elements'].filter(function (item) { return item.type == "way"; });
                        listPaths = this.createListPaths(listWays);
                        listNodes = response['elements'].filter(function (item) { return item.type == "node"; });
                        dictNodes = this.createDictNodes(listNodes);
                        if (!(!Array.isArray(listPaths) || !listPaths.length)) return [3 /*break*/, 1];
                        // if does not exist, is not an array, or is empty
                        this.listText = ["No results to show."];
                        this.messageService.updateComputeStatus("No results to show.");
                        return [3 /*break*/, 3];
                    case 1:
                        listPolygons = this.createListPolygons(listPaths, dictNodes);
                        _a = this;
                        return [4 /*yield*/, this.getListPathsPOIs(listPolygons)];
                    case 2:
                        _a.listPathsPOIs = _b.sent(); // async/await
                        for (i = 0; i < this.listPathsPOIs.length; i++) {
                            console.log(this.listPathsPOIs[i][0]);
                            console.log(JSON.stringify(this.listPathsPOIs[i][1]));
                        }
                        this.listText = this.createTextFromListPOIs(this.listPathsPOIs);
                        this.messageService.updateComputeStatus("Results are now ready.");
                        console.log(this.listText);
                        _b.label = 3;
                    case 3:
                        this.messageService.updateListPathPOIText(this.listText);
                        return [2 /*return*/];
                }
            });
        }); }, function (error) {
            _this.messageService.updateComputeStatus("Error");
            console.log("Error getting paths near you: " + (error.message || error));
            alert("Error getting paths near you: " + (error.message || error));
        });
    };
    HomeComponent.prototype.createDictNodes = function (listNodes) {
        var dict = {};
        var numNodes = Object.keys(listNodes).length;
        for (var i = 0; i < numNodes; i++) {
            dict[listNodes[i].id] = [listNodes[i].lat, listNodes[i].lon];
        }
        return dict;
    };
    HomeComponent.prototype.createListPaths = function (listWays) {
        var list = [];
        var numWays = Object.keys(listWays).length;
        for (var i = 0; i < numWays; i++) {
            list.push(listWays[i]);
        }
        return list;
    };
    HomeComponent.prototype.createListPolygons = function (listPaths, dictNodes) {
        var list = [];
        var r = 0.0003; // some distance away from road
        listPaths.forEach(function (element) {
            var num = element.nodes.length;
            var a = [];
            var b = [];
            var lat1 = 0.8 * dictNodes[element.nodes[0]][0] + 0.2 * dictNodes[element.nodes[1]][0]; // start a little further away
            var lon1 = 0.8 * dictNodes[element.nodes[0]][1] + 0.2 * dictNodes[element.nodes[1]][1];
            var lat2;
            var lon2;
            var first;
            var m;
            for (var i = 1; i < num; i++) {
                if (i == num - 1) {
                    lat2 = 0.2 * dictNodes[element.nodes[0]][0] + 0.8 * dictNodes[element.nodes[i]][0];
                    lon2 = 0.2 * dictNodes[element.nodes[0]][1] + 0.8 * dictNodes[element.nodes[i]][1];
                }
                else {
                    lat2 = dictNodes[element.nodes[i]][0];
                    lon2 = dictNodes[element.nodes[i]][1];
                }
                m = 1 / ((lon2 - lon1) / (lat2 - lat1));
                var den_1 = Math.sqrt(1 + Math.pow(m, 2));
                var c_1 = 1 / den_1;
                var s_1 = m / den_1;
                a = a.concat([lat1 - r * c_1, lon1 - r * s_1]);
                if (i == 1) {
                    first = [lat1 - r * c_1, lon1 - r * s_1];
                }
                b.push([lat1 + r * c_1, lon1 + r * s_1]);
                lat1 = lat2;
                lon1 = lon2;
            }
            var den = Math.sqrt(1 + Math.pow(m, 2));
            var c = 1 / den;
            var s = m / den;
            a = a.concat([lat1 - r * c, lon1 - r * s]);
            b.push([lat1 + r * c, lon1 + r * s]); //push as a pair because lat lon order needs to be preserved
            while (b.length != 0) {
                a = a.concat(b.pop()); // concat b list in reverse manner
            }
            a = a.concat(first);
            //console.log(a.join(' '));
            //console.log(element.tags.name);
            var name;
            if (element.tags.junction == 'roundabout') {
                name = element.tags.name + ' roundabout'; //indicate roundabout
            }
            else {
                name = element.tags.name;
            }
            list.push([a.join(' '), name]);
        });
        return list;
    };
    HomeComponent.prototype.getListPathsPOIs = function (listPolygons) {
        var _this = this;
        //return promise of list
        var that = this;
        var list;
        var promises = [];
        var num = listPolygons.length;
        var delay = new Promise(function (resolve) { return setTimeout(resolve, 200); }); //set delay between http requests to avoid error 429
        promises.push(delay);
        for (var i = 0; i < num; i++) {
            createPromise(i);
        }
        return Promise.all(promises).then(function (values) {
            var l = [];
            for (var i = 0; i < values.length; i++) {
                if (values[i] != undefined) {
                    l.push(values[i]);
                    //console.log(values[i][0]);
                    //console.log(JSON.stringify(values[i][1]));
                }
            }
            return l;
        }).catch(function (error) {
            _this.messageService.updateComputeStatus("Error");
            console.log("Error getting POIs: " + (error.message || error));
            alert("Error getting POIs: " + (error.message || error));
            return [error.message];
        });
        function createPromise(i) {
            var poly = listPolygons[i][0];
            var name = listPolygons[i][1]; // if undefined, then output all
            var queryGetListPOIs;
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
            var promise = new Promise(function (resolve, reject) {
                that.httpService.postData(encodeURI(that.overpassUrl), queryGetListPOIs).subscribe(function (response) {
                    resolve([name, response['elements']]);
                }, function (error) {
                    console.log(name + ' ' + error.message);
                    reject(error);
                });
            });
            promises.push(promise);
            promises.push(delay);
        }
    };
    HomeComponent.prototype.createTextFromListPOIs = function (listPOI) {
        var list = [];
        listPOI.forEach(function (element) {
            var str = new Set(); // prevent overlap/repeated poi data
            //console.log(element[0]);
            //console.log(JSON.stringify(element[1]));
            element[1].forEach(function (poi) {
                var p = '';
                if (poi.tags != undefined) {
                    if (poi.tags.amenity != undefined) {
                        p += 'amenity, ';
                        if (poi.tags.cuisine != undefined) {
                            if (poi.tags.cuisine.includes('_')) {
                                p += poi.tags.cuisine.split('_').join(' ') + ' ';
                            }
                            else {
                                p += poi.tags.cuisine + ' ';
                            }
                        }
                        if (poi.tags.amenity.includes('_')) {
                            p += poi.tags.amenity.split('_').join(' ');
                        }
                        else {
                            p += poi.tags.amenity;
                        }
                        if (poi.tags.name != undefined) {
                            p += ', ' + poi.tags.name;
                        }
                    }
                    else if (poi.tags.shop != undefined) {
                        if (poi.tags.shop.includes('_')) {
                            p += poi.tags.shop.split('_').join(' ');
                        }
                        else {
                            p += poi.tags.shop;
                        }
                        p += ' shop';
                        if (poi.tags.name != undefined) {
                            p += ', ' + poi.tags.name;
                        }
                    }
                    else if (poi.tags.tourism != undefined) {
                        p += 'tourism, ';
                        if (poi.tags.tourism.includes('_')) {
                            p += poi.tags.tourism.split('_').join(' ');
                        }
                        else {
                            p += poi.tags.tourism;
                        }
                        if (poi.tags.name != undefined) {
                            p += ', ' + poi.tags.name;
                        }
                    }
                    else if (poi.tags.leisure != undefined) {
                        p += 'leisure, ';
                        if (poi.tags.leisure.includes('_')) {
                            p += poi.tags.leisure.split('_').join(' ');
                        }
                        else {
                            p += poi.tags.leisure;
                        }
                        if (poi.tags.name != undefined) {
                            p += ', ' + poi.tags.name;
                        }
                    }
                    else if (poi.tags.historic != undefined) {
                        p += 'historic, ';
                        if (poi.tags.historic.includes('_')) {
                            p += poi.tags.historic.split('_').join(' ');
                        }
                        else {
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
    };
    HomeComponent.prototype.ngOnDestroy = function () {
        // prevent memory leak
        this._subscriptionCS.unsubscribe();
    };
    HomeComponent = __decorate([
        core_1.Component({
            selector: "Home",
            moduleId: module.id,
            templateUrl: "./home.component.html",
            providers: [http_service_1.HttpService]
        }),
        __metadata("design:paramtypes", [http_service_1.HttpService, message_service_1.MessageService])
    ], HomeComponent);
    return HomeComponent;
}());
exports.HomeComponent = HomeComponent;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG9tZS5jb21wb25lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJob21lLmNvbXBvbmVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHNDQUFrRDtBQUNsRCxxRUFBb0g7QUFDcEgsa0NBQW9DO0FBQ3BDLG1EQUFpRDtBQUNqRCx5REFBdUQ7QUFVdkQ7SUE2QkksdUJBQW9CLFdBQXdCLEVBQVUsY0FBOEI7UUFBcEYsaUJBTUM7UUFObUIsZ0JBQVcsR0FBWCxXQUFXLENBQWE7UUFBVSxtQkFBYyxHQUFkLGNBQWMsQ0FBZ0I7UUE1QjdFLFNBQUksR0FBRyxrVkFBa1YsQ0FBQTtRQUN6VixVQUFLLEdBQUcsa0ZBQWtGLENBQUE7UUFDMUYsT0FBRSxHQUFHLElBQUksQ0FBQztRQUlWLGlCQUFZLEdBQUcsQ0FBQyxlQUFlLEVBQUUsYUFBYSxFQUFFLGtCQUFrQixDQUFDLENBQUM7UUFDcEUsY0FBUyxHQUFHLEVBQUUsZUFBZSxFQUFFLENBQUMsVUFBVSxFQUFFLENBQUMsU0FBUyxDQUFDLEVBQUUsYUFBYSxFQUFFLENBQUMsVUFBVSxFQUFFLENBQUMsU0FBUyxDQUFDLEVBQUMsQ0FBQztRQUtsRyxzQkFBaUIsR0FBRyw4Q0FBOEMsQ0FBQztRQUVuRSxnQkFBVyxHQUFHLHdDQUF3QyxDQUFDO1FBRTlELHFGQUFxRjtRQUNyRixpRkFBaUY7UUFDakYsd0VBQXdFO1FBQ3hFLCtEQUErRDtRQUV4RCxrQkFBYSxHQUFJLEVBQUUsQ0FBQztRQUVwQixhQUFRLEdBQUcsRUFBRSxDQUFDO1FBTWpCLGdEQUFxQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzVCLElBQUksQ0FBQyxhQUFhLEdBQUcsY0FBYyxDQUFDLGFBQWEsQ0FBQztRQUNsRCxJQUFJLENBQUMsZUFBZSxHQUFHLGNBQWMsQ0FBQyxtQkFBbUIsQ0FBQyxTQUFTLENBQUMsVUFBQyxNQUFNO1lBQ3ZFLEtBQUksQ0FBQyxhQUFhLEdBQUcsTUFBTSxDQUFDO1FBQ2hDLENBQUMsQ0FBQyxD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RyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQzs0QkFDOUIsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7d0JBQzVDLENBQUM7d0JBQUMsSUFBSSxDQUFDLENBQUM7NEJBQ0osQ0FBQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO3dCQUN2QixDQUFDO3dCQUNELENBQUMsSUFBSSxPQUFPLENBQUM7d0JBQ2IsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksU0FBUyxDQUFDLENBQUMsQ0FBQzs0QkFDN0IsQ0FBQyxJQUFJLElBQUksR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQzt3QkFDOUIsQ0FBQztvQkFDTCxDQUFDO29CQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sSUFBSSxTQUFTLENBQUMsQ0FBQyxDQUFDO3dCQUN2QyxDQUFDLElBQUksV0FBVyxDQUFDO3dCQUNqQixFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDOzRCQUNqQyxDQUFDLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQzt3QkFDL0MsQ0FBQzt3QkFBQyxJQUFJLENBQUMsQ0FBQzs0QkFDSixDQUFDLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7d0JBQzFCLENBQUM7d0JBQ0QsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksU0FBUyxDQUFDLENBQUMsQ0FBQzs0QkFDN0IsQ0FBQyxJQUFJLElBQUksR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQzt3QkFDOUIsQ0FBQztvQkFDTCxDQUFDO29CQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sSUFBSSxTQUFTLENBQUMsQ0FBQyxDQUFDO3dCQUN2QyxDQUFDLElBQUksV0FBVyxDQUFDO3dCQUNqQixFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDOzRCQUNqQyxDQUFDLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQzt3QkFDL0MsQ0FBQzt3QkFBQyxJQUFJLENBQUMsQ0FBQzs0QkFDSixDQUFDLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7d0JBQzFCLENBQUM7d0JBQ0QsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksU0FBUyxDQUFDLENBQUMsQ0FBQzs0QkFDN0IsQ0FBQyxJQUFJLElBQUksR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQzt3QkFDOUIsQ0FBQztvQkFDTCxDQUFDO29CQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsSUFBSSxTQUFTLENBQUMsQ0FBQyxDQUFDO3dCQUN4QyxDQUFDLElBQUksWUFBWSxDQUFDO3dCQUNsQixFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDOzRCQUNsQyxDQUFDLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQzt3QkFDaEQsQ0FBQzt3QkFBQyxJQUFJLENBQUMsQ0FBQzs0QkFDSixDQUFDLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7d0JBQzNCLENBQUM7d0JBQ0QsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksU0FBUyxDQUFDLENBQUMsQ0FBQzs0QkFDN0IsQ0FBQyxJQUFJLElBQUksR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQzt3QkFDOUIsQ0FBQztvQkFDTCxDQUFDO2dCQUNMLENBQUM7Z0JBQ0QsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNmLENBQUMsQ0FBQyxDQUFDO1lBQ0gseURBQXlEO1lBQ3pELElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLCtDQUErQztRQUNySCxDQUFDLENBQUMsQ0FBQztRQUNILE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUVELG1DQUFXLEdBQVg7UUFDSSxzQkFBc0I7UUFDdEIsSUFBSSxDQUFDLGVBQWUsQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUN2QyxDQUFDO0lBalZRLGFBQWE7UUFQekIsZ0JBQVMsQ0FBQztZQUNQLFFBQVEsRUFBRSxNQUFNO1lBQ2hCLFFBQVEsRUFBRSxNQUFNLENBQUMsRUFBRTtZQUNuQixXQUFXLEVBQUUsdUJBQXVCO1lBQ3BDLFNBQVMsRUFBRSxDQUFDLDBCQUFXLENBQUM7U0FDM0IsQ0FBQzt5Q0ErQm1DLDBCQUFXLEVBQTBCLGdDQUFjO09BN0IzRSxhQUFhLENBa1h6QjtJQUFELG9CQUFDO0NBQUEsQUFsWEQsSUFrWEM7QUFsWFksc0NBQWEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21wb25lbnQsIE9uSW5pdCB9IGZyb20gXCJAYW5ndWxhci9jb3JlXCI7XHJcbmltcG9ydCB7IExvY2F0aW9uLCBnZXRDdXJyZW50TG9jYXRpb24sIGlzRW5hYmxlZCwgZGlzdGFuY2UsIGVuYWJsZUxvY2F0aW9uUmVxdWVzdCB9IGZyb20gXCJuYXRpdmVzY3JpcHQtZ2VvbG9jYXRpb25cIjtcclxuaW1wb3J0IHsgQWNjdXJhY3kgfSBmcm9tIFwidWkvZW51bXNcIjtcclxuaW1wb3J0IHsgSHR0cFNlcnZpY2UgfSBmcm9tIFwiLi4vLi4vaHR0cC5zZXJ2aWNlXCI7XHJcbmltcG9ydCB7IE1lc3NhZ2VTZXJ2aWNlIH0gZnJvbSBcIi4uLy4uL21lc3NhZ2Uuc2VydmljZVwiO1xyXG5pbXBvcnQgeyBMaXN0UGlja2VyIH0gZnJvbSBcInVpL2xpc3QtcGlja2VyXCI7XHJcblxyXG5AQ29tcG9uZW50KHtcclxuICAgIHNlbGVjdG9yOiBcIkhvbWVcIixcclxuICAgIG1vZHVsZUlkOiBtb2R1bGUuaWQsXHJcbiAgICB0ZW1wbGF0ZVVybDogXCIuL2hvbWUuY29tcG9uZW50Lmh0bWxcIixcclxuICAgIHByb3ZpZGVyczogW0h0dHBTZXJ2aWNlXVxyXG59KVxyXG5cclxuZXhwb3J0IGNsYXNzIEhvbWVDb21wb25lbnQgaW1wbGVtZW50cyBPbkluaXQge1xyXG4gICAgcHVibGljIGRlc2MgPSBcIlxcblxcblRoaXMgZmVhdHVyZSBhaW1zIHRvIGNvbXBsZW1lbnQgU291bmRzY2FwZeKAmXMgZXhpc3RpbmcgZmVhdHVyZXMuIEZvciBlYWNoIHBhdGggbmVhciB5b3UsIGZpbmQgb3V0IHdoaWNoIHBvaW50cyBvZiBpbnRlcmVzdChQT0lzKSBsaWUgYWxvbmcgdGhhdCBwYXJ0aWN1bGFyIHBhdGguIFByb2JhYmx5IG1vc3QgdXNlZnVsIHdoZW4gYXBwcm9hY2hpbmcgaW50ZXJzZWN0aW9ucy4gU2V0IGNlcnRhaW4gUE9JcyBhcyBiZWFjb25zIG9yIHJlZmVyZW5jZSBwb2ludHMgb24gU291bmRzY2FwZSB0byBsZWFybiBhYm91dCB0aGVpciBwb3NpdGlvbiByZWxhdGl2ZSB0byB5b3Vyc2VsZi5cXG5cXG5cXG5cIlxyXG4gICAgcHVibGljIGluc3RyID0gXCJTZWxlY3QgZGVzaXJlZCBsb2NhdGlvbi5cXG5SZXN1bHRzIGNhbiBiZSBhY2Nlc3NlZCB2aWEgdGhlIFBPSSB0YWIgYXQgdGhlIGJvdHRvbS5cIlxyXG4gICAgcHVibGljIG5sID0gXCJcXG5cIjtcclxuXHJcbiAgICBwdWJsaWMgY29tcHV0ZVN0YXR1cztcclxuXHJcbiAgICBwdWJsaWMgbG9jYXRpb25MaXN0ID0gW1wiVGh1cmxvZSBQbGFjZVwiLCBcIlNldmVuIERpYWxzXCIsIFwiQ3VycmVudCBMb2NhdGlvblwiXTtcclxuICAgIHB1YmxpYyBkaWN0Q29vcmQgPSB7IFwiVGh1cmxvZSBQbGFjZVwiOiBbNTEuNDk1MTgyNSwgLTAuMTczNDQ3OV0sIFwiU2V2ZW4gRGlhbHNcIjogWzUxLjUxMzY4NDMsIC0wLjEyNzA5MTBdfTtcclxuICAgIHB1YmxpYyBwaWNrZWQ6IHN0cmluZztcclxuXHJcbiAgICBwdWJsaWMgY29vcmRpbmF0ZTsgLy9bbGF0LGxvbl1cclxuXHJcbiAgICBwdWJsaWMgb3ZlcnBhc3NHZXRQcmVVcmwgPSBcImh0dHA6Ly9vdmVycGFzcy1hcGkuZGUvYXBpL2ludGVycHJldGVyP2RhdGE9XCI7XHJcblxyXG4gICAgcHVibGljIG92ZXJwYXNzVXJsID0gXCJodHRwOi8vb3ZlcnBhc3MtYXBpLmRlL2FwaS9pbnRlcnByZXRlclwiO1xyXG5cclxuICAgIC8vcHVibGljIHRva2VuVXJsID0gXCJodHRwczovL3dlc3R1cy5hcGkuY29nbml0aXZlLm1pY3Jvc29mdC5jb20vc3RzL3YxLjAvaXNzdWVUb2tlblwiO1xyXG4gICAgLy9wdWJsaWMgc3luVXJsID0gXCJodHRwczovL3dlc3R1cy50dHMuc3BlZWNoLm1pY3Jvc29mdC5jb20vY29nbml0aXZlc2VydmljZXMvdjFcIjtcclxuICAgIC8vcHVibGljIHN5blVybCA9IFwiaHR0cHM6Ly93ZXN0dXMuYXBpLmNvZ25pdGl2ZS5taWNyb3NvZnQuY29tL3N0cy92MS4wXCI7XHJcbiAgICAvL3B1YmxpYyBzeW5VcmwgPSBcImh0dHA6Ly9zcGVlY2gucGxhdGZvcm0uYmluZy5jb20vc3ludGhlc2l6ZVwiO1xyXG5cclxuICAgIHB1YmxpYyBsaXN0UGF0aHNQT0lzICA9IFtdO1xyXG5cclxuICAgIHB1YmxpYyBsaXN0VGV4dCA9IFtdO1xyXG5cclxuICAgIHB1YmxpYyBfc3Vic2NyaXB0aW9uQ1M7XHJcblxyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgaHR0cFNlcnZpY2U6IEh0dHBTZXJ2aWNlLCBwcml2YXRlIG1lc3NhZ2VTZXJ2aWNlOiBNZXNzYWdlU2VydmljZSkge1xyXG4gICAgICAgIGVuYWJsZUxvY2F0aW9uUmVxdWVzdCh0cnVlKTtcclxuICAgICAgICB0aGlzLmNvbXB1dGVTdGF0dXMgPSBtZXNzYWdlU2VydmljZS5jb21wdXRlU3RhdHVzO1xyXG4gICAgICAgIHRoaXMuX3N1YnNjcmlwdGlvbkNTID0gbWVzc2FnZVNlcnZpY2UuY29tcHV0ZVN0YXR1c1NvdXJjZS5zdWJzY3JpYmUoKHN0YXR1cykgPT4geyBcclxuICAgICAgICAgICAgdGhpcy5jb21wdXRlU3RhdHVzID0gc3RhdHVzOyBcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBuZ09uSW5pdCgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmlzTG9jYXRpb25FbmFibGVkKCk7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgc2VsZWN0ZWRJbmRleENoYW5nZWQoYXJncykge1xyXG4gICAgICAgIGxldCBwaWNrZXIgPSA8TGlzdFBpY2tlcj5hcmdzLm9iamVjdDtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIlBpY2tlZCBcIiArIHRoaXMubG9jYXRpb25MaXN0W3BpY2tlci5zZWxlY3RlZEluZGV4XSk7XHJcbiAgICAgICAgaWYgKHRoaXMubG9jYXRpb25MaXN0W3BpY2tlci5zZWxlY3RlZEluZGV4XSA9PSBcIkN1cnJlbnQgTG9jYXRpb25cIikge1xyXG4gICAgICAgICAgICB0aGlzLmNvb3JkaW5hdGUgPSAgYXdhaXQgdGhpcy5yZWZyZXNoQ3VycmVudFBvc2l0aW9uKCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5jb29yZGluYXRlID0gdGhpcy5kaWN0Q29vcmRbdGhpcy5sb2NhdGlvbkxpc3RbcGlja2VyLnNlbGVjdGVkSW5kZXhdXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGlzTG9jYXRpb25FbmFibGVkKCkge1xyXG4gICAgICAgIGlzRW5hYmxlZCgpLnRoZW4oZnVuY3Rpb24gKGlzTG9jYXRpb25FbmFibGVkKSB7XHJcbiAgICAgICAgICAgIGxldCBtZXNzYWdlID0gXCJMb2NhdGlvbiBzZXJ2aWNlcyBhcmUgbm90IGF2YWlsYWJsZVwiO1xyXG4gICAgICAgICAgICBpZiAoaXNMb2NhdGlvbkVuYWJsZWQpIHtcclxuICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSBcIkxvY2F0aW9uIHNlcnZpY2VzIGFyZSBhdmFpbGFibGVcIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBhbGVydChtZXNzYWdlKTtcclxuICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3IpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJMb2NhdGlvbiBlcnJvcjogXCIgKyAoZXJyb3IubWVzc2FnZSB8fCBlcnJvcikpO1xyXG4gICAgICAgICAgICBhbGVydChcIkxvY2F0aW9uIGVycm9yOiBcIiArIChlcnJvci5tZXNzYWdlIHx8IGVycm9yKSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlZnJlc2hDdXJyZW50UG9zaXRpb24oKSB7XHJcblxyXG4gICAgICAgIHJldHVybiBnZXRDdXJyZW50TG9jYXRpb24oe1xyXG4gICAgICAgICAgICBkZXNpcmVkQWNjdXJhY3k6IEFjY3VyYWN5LmhpZ2gsXHJcbiAgICAgICAgICAgIHRpbWVvdXQ6IDUwMDBcclxuICAgICAgICB9KVxyXG4gICAgICAgICAgICAudGhlbihsb2NhdGlvbiA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkxvY2F0aW9uIHJlY2VpdmVkOiBcIiArIGxvY2F0aW9uLmxhdGl0dWRlICsgXCIgXCIgKyBsb2NhdGlvbi5sb25naXR1ZGUpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFtsb2NhdGlvbi5sYXRpdHVkZSwgbG9jYXRpb24ubG9uZ2l0dWRlXTtcclxuICAgICAgICAgICAgfSkuY2F0Y2goZXJyb3IgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJFcnJvciBnZXR0aW5nIGN1cnJlbnQgbG9jYXRpb246IFwiICsgKGVycm9yLm1lc3NhZ2UgfHwgZXJyb3IpKTtcclxuICAgICAgICAgICAgICAgIGFsZXJ0KFwiRXJyb3IgZ2V0dGluZyBjdXJyZW50IGxvY2F0aW9uOiBcIiArIChlcnJvci5tZXNzYWdlIHx8IGVycm9yKSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZXJyb3I7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjb21wdXRlUGF0aHNQT0lzKCk6IHZvaWQge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwic3RhcnRcIik7XHJcbiAgICAgICAgdGhpcy5tZXNzYWdlU2VydmljZS51cGRhdGVDb21wdXRlU3RhdHVzKFwiQ29tcHV0aW5nIFBPSXMgZm9yIGVhY2ggcGF0aCBuZWFyIHlvdS4uLlwiKTtcclxuICAgICAgICB0aGlzLm1lc3NhZ2VTZXJ2aWNlLnVwZGF0ZUxpc3RQYXRoUE9JVGV4dChbXCJcIl0pO1xyXG4gICAgICAgIC8vY29uc29sZS5sb2codGhpcy5jb29yZGluYXRlKTtcclxuICAgICAgICBsZXQgcXVlcnlHZXRMaXN0UGF0aHMgPSAnW291dDpqc29uXVt0aW1lb3V0OjUwXTt3YXkoYXJvdW5kOjE4LCcgKyB0aGlzLmNvb3JkaW5hdGVbMF0gKyAnLCcgKyB0aGlzLmNvb3JkaW5hdGVbMV0gKyAnKVthcmVhIX5cInllc1wiXVtoaWdod2F5flwiLlwiXVtoaWdod2F5IX5cIm1vdG9yd2F5fG1vdG9yd2F5X2xpbmt8dHJ1bmt8dHJ1bmtfbGlua3xjeWNsZXdheXxjcm9zc2luZ3xmb290d2F5XCJdW3NpZGV3YWxrIX5cIm5vfG5vbmVcIl07KC5fOz47KTtvdXQ7JztcclxuICAgICAgICAvL2NvbnNvbGUubG9nKHF1ZXJ5R2V0TGlzdFBhdGhzKTtcclxuICAgICAgICAvL2xldCB0aGF0ID0gdGhpcztcclxuICAgICAgICB0aGlzLmh0dHBTZXJ2aWNlLnBvc3REYXRhKGVuY29kZVVSSSh0aGlzLm92ZXJwYXNzVXJsKSwgcXVlcnlHZXRMaXN0UGF0aHMpIC8vcG9zdCBlbmFibGVzIGxvbmdlciBxdWVyeSB0aGFuIGdldFxyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKGFzeW5jKHJlc3BvbnNlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKFwic3VjY2Vzc1wiKTtcclxuICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkocmVzcG9uc2VbJ2VsZW1lbnRzJ10pKTtcclxuICAgICAgICAgICAgICAgIGxldCBsaXN0V2F5cyA9IHJlc3BvbnNlWydlbGVtZW50cyddLmZpbHRlcihpdGVtID0+IGl0ZW0udHlwZSA9PSBcIndheVwiKTtcclxuICAgICAgICAgICAgICAgIGxldCBsaXN0UGF0aHMgPSB0aGlzLmNyZWF0ZUxpc3RQYXRocyhsaXN0V2F5cyk7XHJcbiAgICAgICAgICAgICAgICBsZXQgbGlzdE5vZGVzID0gcmVzcG9uc2VbJ2VsZW1lbnRzJ10uZmlsdGVyKGl0ZW0gPT4gaXRlbS50eXBlID09IFwibm9kZVwiKTtcclxuICAgICAgICAgICAgICAgIGxldCBkaWN0Tm9kZXMgPSB0aGlzLmNyZWF0ZURpY3ROb2RlcyhsaXN0Tm9kZXMpO1xyXG4gICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeShsaXN0UGF0aHMpKTtcclxuICAgICAgICAgICAgICAgIGlmICghQXJyYXkuaXNBcnJheShsaXN0UGF0aHMpIHx8ICFsaXN0UGF0aHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgZG9lcyBub3QgZXhpc3QsIGlzIG5vdCBhbiBhcnJheSwgb3IgaXMgZW1wdHlcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmxpc3RUZXh0ID0gW1wiTm8gcmVzdWx0cyB0byBzaG93LlwiXTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1lc3NhZ2VTZXJ2aWNlLnVwZGF0ZUNvbXB1dGVTdGF0dXMoXCJObyByZXN1bHRzIHRvIHNob3cuXCIpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgbGlzdFBvbHlnb25zID0gdGhpcy5jcmVhdGVMaXN0UG9seWdvbnMobGlzdFBhdGhzLCBkaWN0Tm9kZXMpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGlzdFBhdGhzUE9JcyA9IGF3YWl0IHRoaXMuZ2V0TGlzdFBhdGhzUE9JcyhsaXN0UG9seWdvbnMpOyAvLyBhc3luYy9hd2FpdFxyXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5saXN0UGF0aHNQT0lzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHRoaXMubGlzdFBhdGhzUE9Jc1tpXVswXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KHRoaXMubGlzdFBhdGhzUE9Jc1tpXVsxXSkpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmxpc3RUZXh0ID0gdGhpcy5jcmVhdGVUZXh0RnJvbUxpc3RQT0lzKHRoaXMubGlzdFBhdGhzUE9Jcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tZXNzYWdlU2VydmljZS51cGRhdGVDb21wdXRlU3RhdHVzKFwiUmVzdWx0cyBhcmUgbm93IHJlYWR5LlwiKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyh0aGlzLmxpc3RUZXh0KTsgXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1lc3NhZ2VTZXJ2aWNlLnVwZGF0ZUxpc3RQYXRoUE9JVGV4dCh0aGlzLmxpc3RUZXh0KTtcclxuICAgICAgICAgICAgfSwgKGVycm9yKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1lc3NhZ2VTZXJ2aWNlLnVwZGF0ZUNvbXB1dGVTdGF0dXMoXCJFcnJvclwiKTtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRXJyb3IgZ2V0dGluZyBwYXRocyBuZWFyIHlvdTogXCIgKyAoZXJyb3IubWVzc2FnZSB8fCBlcnJvcikpO1xyXG4gICAgICAgICAgICAgICAgYWxlcnQoXCJFcnJvciBnZXR0aW5nIHBhdGhzIG5lYXIgeW91OiBcIiArIChlcnJvci5tZXNzYWdlIHx8IGVycm9yKSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjcmVhdGVEaWN0Tm9kZXMobGlzdE5vZGVzKTogT2JqZWN0IHtcclxuICAgICAgICBsZXQgZGljdCA9IHt9O1xyXG4gICAgICAgIGxldCBudW1Ob2RlcyA9IE9iamVjdC5rZXlzKGxpc3ROb2RlcykubGVuZ3RoO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtTm9kZXM7IGkrKykge1xyXG4gICAgICAgICAgICBkaWN0W2xpc3ROb2Rlc1tpXS5pZF0gPSBbbGlzdE5vZGVzW2ldLmxhdCwgbGlzdE5vZGVzW2ldLmxvbl07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBkaWN0O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjcmVhdGVMaXN0UGF0aHMobGlzdFdheXMpOiBPYmplY3Qge1xyXG4gICAgICAgIGxldCBsaXN0ID0gW107IFxyXG4gICAgICAgIGxldCBudW1XYXlzID0gT2JqZWN0LmtleXMobGlzdFdheXMpLmxlbmd0aDtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bVdheXM7IGkrKykge1xyXG4gICAgICAgICAgICBsaXN0LnB1c2gobGlzdFdheXNbaV0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbGlzdDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY3JlYXRlTGlzdFBvbHlnb25zKGxpc3RQYXRocywgZGljdE5vZGVzKTogT2JqZWN0IHtcclxuICAgICAgICBsZXQgbGlzdCA9IFtdO1xyXG4gICAgICAgIGxldCByID0gMC4wMDAzOyAvLyBzb21lIGRpc3RhbmNlIGF3YXkgZnJvbSByb2FkXHJcbiAgICAgICAgbGlzdFBhdGhzLmZvckVhY2goZWxlbWVudCA9PiB7XHJcbiAgICAgICAgICAgIGxldCBudW0gPSBlbGVtZW50Lm5vZGVzLmxlbmd0aDtcclxuICAgICAgICAgICAgbGV0IGEgPSBbXTtcclxuICAgICAgICAgICAgbGV0IGIgPSBbXTtcclxuICAgICAgICAgICAgbGV0IGxhdDEgPSAwLjggKiBkaWN0Tm9kZXNbZWxlbWVudC5ub2Rlc1swXV1bMF0gKyAwLjIgKiBkaWN0Tm9kZXNbZWxlbWVudC5ub2Rlc1sxXV1bMF07IC8vIHN0YXJ0IGEgbGl0dGxlIGZ1cnRoZXIgYXdheVxyXG4gICAgICAgICAgICBsZXQgbG9uMSA9IDAuOCAqIGRpY3ROb2Rlc1tlbGVtZW50Lm5vZGVzWzBdXVsxXSArIDAuMiAqIGRpY3ROb2Rlc1tlbGVtZW50Lm5vZGVzWzFdXVsxXTtcclxuICAgICAgICAgICAgbGV0IGxhdDI7XHJcbiAgICAgICAgICAgIGxldCBsb24yO1xyXG4gICAgICAgICAgICBsZXQgZmlyc3Q7XHJcbiAgICAgICAgICAgIGxldCBtO1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8IG51bTsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaSA9PSBudW0gLSAxKSB7IC8vbGFzdCBvbmUgLy8gZW5kIGEgbGl0dGxlIGlud2FyZFxyXG4gICAgICAgICAgICAgICAgICAgIGxhdDIgPSAwLjIgKiBkaWN0Tm9kZXNbZWxlbWVudC5ub2Rlc1swXV1bMF0gKyAwLjggKiBkaWN0Tm9kZXNbZWxlbWVudC5ub2Rlc1tpXV1bMF07XHJcbiAgICAgICAgICAgICAgICAgICAgbG9uMiA9IDAuMiAqIGRpY3ROb2Rlc1tlbGVtZW50Lm5vZGVzWzBdXVsxXSArIDAuOCAqIGRpY3ROb2Rlc1tlbGVtZW50Lm5vZGVzW2ldXVsxXTsgXHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGxhdDIgPSBkaWN0Tm9kZXNbZWxlbWVudC5ub2Rlc1tpXV1bMF07XHJcbiAgICAgICAgICAgICAgICAgICAgbG9uMiA9IGRpY3ROb2Rlc1tlbGVtZW50Lm5vZGVzW2ldXVsxXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIG0gPSAxIC8gKChsb24yIC0gbG9uMSkgLyAobGF0MiAtIGxhdDEpKTtcclxuICAgICAgICAgICAgICAgIGxldCBkZW4gPSBNYXRoLnNxcnQoMSArIE1hdGgucG93KG0sIDIpKTtcclxuICAgICAgICAgICAgICAgIGxldCBjID0gMSAvIGRlbjtcclxuICAgICAgICAgICAgICAgIGxldCBzID0gbSAvIGRlbjtcclxuICAgICAgICAgICAgICAgIGEgPSBhLmNvbmNhdChbbGF0MSAtIHIgKiBjLCBsb24xIC0gciAqIHNdKTtcclxuICAgICAgICAgICAgICAgIGlmIChpID09IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICBmaXJzdCA9IFtsYXQxIC0gciAqIGMsIGxvbjEgLSByICogc107XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBiLnB1c2goW2xhdDEgKyByICogYywgbG9uMSArIHIgKiBzXSk7XHJcbiAgICAgICAgICAgICAgICBsYXQxID0gbGF0MjtcclxuICAgICAgICAgICAgICAgIGxvbjEgPSBsb24yO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGxldCBkZW4gPSBNYXRoLnNxcnQoMSArIE1hdGgucG93KG0sIDIpKTtcclxuICAgICAgICAgICAgbGV0IGMgPSAxIC8gZGVuO1xyXG4gICAgICAgICAgICBsZXQgcyA9IG0gLyBkZW47XHJcbiAgICAgICAgICAgIGEgPSBhLmNvbmNhdChbbGF0MSAtIHIgKiBjLCBsb24xIC0gciAqIHNdKTtcclxuICAgICAgICAgICAgYi5wdXNoKFtsYXQxICsgciAqIGMsIGxvbjEgKyByICogc10pOyAvL3B1c2ggYXMgYSBwYWlyIGJlY2F1c2UgbGF0IGxvbiBvcmRlciBuZWVkcyB0byBiZSBwcmVzZXJ2ZWRcclxuICAgICAgICAgICAgd2hpbGUgKGIubGVuZ3RoICE9IDApIHtcclxuICAgICAgICAgICAgICAgIGEgPSBhLmNvbmNhdChiLnBvcCgpKTsgLy8gY29uY2F0IGIgbGlzdCBpbiByZXZlcnNlIG1hbm5lclxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGEgPSBhLmNvbmNhdChmaXJzdCk7XHJcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coYS5qb2luKCcgJykpO1xyXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKGVsZW1lbnQudGFncy5uYW1lKTtcclxuICAgICAgICAgICAgbGV0IG5hbWU7XHJcbiAgICAgICAgICAgIGlmIChlbGVtZW50LnRhZ3MuanVuY3Rpb24gPT0gJ3JvdW5kYWJvdXQnKSB7XHJcbiAgICAgICAgICAgICAgICBuYW1lID0gZWxlbWVudC50YWdzLm5hbWUgKyAnIHJvdW5kYWJvdXQnOyAgIC8vaW5kaWNhdGUgcm91bmRhYm91dFxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgbmFtZSA9IGVsZW1lbnQudGFncy5uYW1lO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGxpc3QucHVzaChbYS5qb2luKCcgJyksIG5hbWVdKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gbGlzdDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0TGlzdFBhdGhzUE9JcyhsaXN0UG9seWdvbnMpIHtcclxuICAgICAgICAvL3JldHVybiBwcm9taXNlIG9mIGxpc3RcclxuICAgICAgICBsZXQgdGhhdCA9IHRoaXM7XHJcbiAgICAgICAgbGV0IGxpc3Q7XHJcbiAgICAgICAgbGV0IHByb21pc2VzID0gW107XHJcbiAgICAgICAgbGV0IG51bSA9IGxpc3RQb2x5Z29ucy5sZW5ndGg7XHJcbiAgICAgICAgY29uc3QgZGVsYXkgPSBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgMjAwKSk7IC8vc2V0IGRlbGF5IGJldHdlZW4gaHR0cCByZXF1ZXN0cyB0byBhdm9pZCBlcnJvciA0MjlcclxuICAgICAgICBwcm9taXNlcy5wdXNoKGRlbGF5KTtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bTsgaSsrKSB7XHJcbiAgICAgICAgICAgIGNyZWF0ZVByb21pc2UoaSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChwcm9taXNlcykudGhlbigodmFsdWVzKSA9PiB7XHJcbiAgICAgICAgICAgIGxldCBsID0gW107XHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsdWVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodmFsdWVzW2ldICE9IHVuZGVmaW5lZCkgeyAgIC8vZG8gbm90IHJldHVybiBwcm9taXNlIHJlc3VsdHMgZnJvbSBkZWxheXMuXHJcbiAgICAgICAgICAgICAgICAgICAgbC5wdXNoKHZhbHVlc1tpXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZyh2YWx1ZXNbaV1bMF0pO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkodmFsdWVzW2ldWzFdKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGw7XHJcbiAgICAgICAgfSkuY2F0Y2goZXJyb3IgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VTZXJ2aWNlLnVwZGF0ZUNvbXB1dGVTdGF0dXMoXCJFcnJvclwiKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJFcnJvciBnZXR0aW5nIFBPSXM6IFwiICsgKGVycm9yLm1lc3NhZ2UgfHwgZXJyb3IpKTtcclxuICAgICAgICAgICAgYWxlcnQoXCJFcnJvciBnZXR0aW5nIFBPSXM6IFwiICsgKGVycm9yLm1lc3NhZ2UgfHwgZXJyb3IpKTtcclxuICAgICAgICAgICAgcmV0dXJuIFtlcnJvci5tZXNzYWdlXTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gY3JlYXRlUHJvbWlzZShpKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgcG9seSA9IGxpc3RQb2x5Z29uc1tpXVswXTtcclxuICAgICAgICAgICAgICAgIGxldCBuYW1lID0gbGlzdFBvbHlnb25zW2ldWzFdOyAvLyBpZiB1bmRlZmluZWQsIHRoZW4gb3V0cHV0IGFsbFxyXG4gICAgICAgICAgICAgICAgbGV0IHF1ZXJ5R2V0TGlzdFBPSXM7XHJcblxyXG4gICAgICAgICAgICAgICAgcXVlcnlHZXRMaXN0UE9JcyA9ICdbb3V0Ompzb25dW3RpbWVvdXQ6OTBdOygnXHJcbiAgICAgICAgICAgICAgICAgICAgKyAnKG5vZGUocG9seTpcIicgKyBwb2x5ICsgJ1wiKVtcImFtZW5pdHlcIl07LW5vZGUocG9seTpcIicgKyBwb2x5ICsgJ1wiKVtcImFtZW5pdHlcIl1bXCJhZGRyOnN0cmVldFwiXVtcImFkZHI6c3RyZWV0XCIhPVwiJyArIG5hbWUgKyAnXCJdOyk7J1xyXG4gICAgICAgICAgICAgICAgICAgICsgJyhub2RlKHBvbHk6XCInICsgcG9seSArICdcIilbXCJzaG9wXCJdOy1ub2RlKHBvbHk6XCInICsgcG9seSArICdcIilbXCJzaG9wXCJdW1wiYWRkcjpzdHJlZXRcIl1bXCJhZGRyOnN0cmVldFwiIT1cIicgKyBuYW1lICsgJ1wiXTspOydcclxuICAgICAgICAgICAgICAgICAgICArICcobm9kZShwb2x5OlwiJyArIHBvbHkgKyAnXCIpW1widG91cmlzbVwiXTstbm9kZShwb2x5OlwiJyArIHBvbHkgKyAnXCIpW1widG91cmlzbVwiXVtcImFkZHI6c3RyZWV0XCJdW1wiYWRkcjpzdHJlZXRcIiE9XCInICsgbmFtZSArICdcIl07KTsnXHJcbiAgICAgICAgICAgICAgICAgICAgKyAnKG5vZGUocG9seTpcIicgKyBwb2x5ICsgJ1wiKVtcImxlaXN1cmVcIl07LW5vZGUocG9seTpcIicgKyBwb2x5ICsgJ1wiKVtcImxlaXN1cmVcIl1bXCJhZGRyOnN0cmVldFwiXVtcImFkZHI6c3RyZWV0XCIhPVwiJyArIG5hbWUgKyAnXCJdOyk7J1xyXG4gICAgICAgICAgICAgICAgICAgICsgJyhub2RlKHBvbHk6XCInICsgcG9seSArICdcIilbXCJoaXN0b3JpY1wiXTstbm9kZShwb2x5OlwiJyArIHBvbHkgKyAnXCIpW1wiaGlzdG9yaWNcIl1bXCJhZGRyOnN0cmVldFwiXVtcImFkZHI6c3RyZWV0XCIhPVwiJyArIG5hbWUgKyAnXCJdOyk7J1xyXG4gICAgICAgICAgICAgICAgICAgICsgJyh3YXkocG9seTpcIicgKyBwb2x5ICsgJ1wiKVtcImFtZW5pdHlcIl07LXdheShwb2x5OlwiJyArIHBvbHkgKyAnXCIpW1wiYW1lbml0eVwiXVtcImFkZHI6c3RyZWV0XCJdW1wiYWRkcjpzdHJlZXRcIiE9XCInICsgbmFtZSArICdcIl07KTsnXHJcbiAgICAgICAgICAgICAgICAgICAgKyAnKHdheShwb2x5OlwiJyArIHBvbHkgKyAnXCIpW1wic2hvcFwiXTstd2F5KHBvbHk6XCInICsgcG9seSArICdcIilbXCJzaG9wXCJdW1wiYWRkcjpzdHJlZXRcIl1bXCJhZGRyOnN0cmVldFwiIT1cIicgKyBuYW1lICsgJ1wiXTspOydcclxuICAgICAgICAgICAgICAgICAgICArICcod2F5KHBvbHk6XCInICsgcG9seSArICdcIilbXCJ0b3VyaXNtXCJdOy13YXkocG9seTpcIicgKyBwb2x5ICsgJ1wiKVtcInRvdXJpc21cIl1bXCJhZGRyOnN0cmVldFwiXVtcImFkZHI6c3RyZWV0XCIhPVwiJyArIG5hbWUgKyAnXCJdOyk7J1xyXG4gICAgICAgICAgICAgICAgICAgICsgJyh3YXkocG9seTpcIicgKyBwb2x5ICsgJ1wiKVtcImxlaXN1cmVcIl07LXdheShwb2x5OlwiJyArIHBvbHkgKyAnXCIpW1wibGVpc3VyZVwiXVtcImFkZHI6c3RyZWV0XCJdW1wiYWRkcjpzdHJlZXRcIiE9XCInICsgbmFtZSArICdcIl07KTsnXHJcbiAgICAgICAgICAgICAgICAgICAgKyAnKHdheShwb2x5OlwiJyArIHBvbHkgKyAnXCIpW1wiaGlzdG9yaWNcIl07LXdheShwb2x5OlwiJyArIHBvbHkgKyAnXCIpW1wiaGlzdG9yaWNcIl1bXCJhZGRyOnN0cmVldFwiXVtcImFkZHI6c3RyZWV0XCIhPVwiJyArIG5hbWUgKyAnXCJdOyk7J1xyXG4gICAgICAgICAgICAgICAgICAgICsgJyhyZWxhdGlvbihwb2x5OlwiJyArIHBvbHkgKyAnXCIpW1wiYW1lbml0eVwiXTstcmVsYXRpb24ocG9seTpcIicgKyBwb2x5ICsgJ1wiKVtcImFtZW5pdHlcIl1bXCJhZGRyOnN0cmVldFwiXVtcImFkZHI6c3RyZWV0XCIhPVwiJyArIG5hbWUgKyAnXCJdOyk7J1xyXG4gICAgICAgICAgICAgICAgICAgICsgJyhyZWxhdGlvbihwb2x5OlwiJyArIHBvbHkgKyAnXCIpW1wic2hvcFwiXTstcmVsYXRpb24ocG9seTpcIicgKyBwb2x5ICsgJ1wiKVtcInNob3BcIl1bXCJhZGRyOnN0cmVldFwiXVtcImFkZHI6c3RyZWV0XCIhPVwiJyArIG5hbWUgKyAnXCJdOyk7J1xyXG4gICAgICAgICAgICAgICAgICAgICsgJyhyZWxhdGlvbihwb2x5OlwiJyArIHBvbHkgKyAnXCIpW1widG91cmlzbVwiXTstcmVsYXRpb24ocG9seTpcIicgKyBwb2x5ICsgJ1wiKVtcInRvdXJpc21cIl1bXCJhZGRyOnN0cmVldFwiXVtcImFkZHI6c3RyZWV0XCIhPVwiJyArIG5hbWUgKyAnXCJdOyk7J1xyXG4gICAgICAgICAgICAgICAgICAgICsgJyhyZWxhdGlvbihwb2x5OlwiJyArIHBvbHkgKyAnXCIpW1wibGVpc3VyZVwiXTstcmVsYXRpb24ocG9seTpcIicgKyBwb2x5ICsgJ1wiKVtcImxlaXN1cmVcIl1bXCJhZGRyOnN0cmVldFwiXVtcImFkZHI6c3RyZWV0XCIhPVwiJyArIG5hbWUgKyAnXCJdOyk7J1xyXG4gICAgICAgICAgICAgICAgICAgICsgJyhyZWxhdGlvbihwb2x5OlwiJyArIHBvbHkgKyAnXCIpW1wiaGlzdG9yaWNcIl07LXJlbGF0aW9uKHBvbHk6XCInICsgcG9seSArICdcIilbXCJoaXN0b3JpY1wiXVtcImFkZHI6c3RyZWV0XCJdW1wiYWRkcjpzdHJlZXRcIiE9XCInICsgbmFtZSArICdcIl07KTsnXHJcbiAgICAgICAgICAgICAgICAgICAgKyAnKTtvdXQ7JztcclxuICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2cocXVlcnlHZXRMaXN0UE9Jcyk7XHJcbiAgICAgICAgICAgICAgICBsZXQgcHJvbWlzZSA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB0aGF0Lmh0dHBTZXJ2aWNlLnBvc3REYXRhKGVuY29kZVVSSSh0aGF0Lm92ZXJwYXNzVXJsKSwgcXVlcnlHZXRMaXN0UE9Jcykuc3Vic2NyaWJlKChyZXNwb25zZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKFtuYW1lLHJlc3BvbnNlWydlbGVtZW50cyddXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSwgKGVycm9yKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKG5hbWUgKyAnICcgKyBlcnJvci5tZXNzYWdlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBwcm9taXNlcy5wdXNoKHByb21pc2UpO1xyXG4gICAgICAgICAgICBwcm9taXNlcy5wdXNoKGRlbGF5KTsgICAgICAgICAgXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjcmVhdGVUZXh0RnJvbUxpc3RQT0lzKGxpc3RQT0kpIHtcclxuICAgICAgICBsZXQgbGlzdCA9IFtdO1xyXG4gICAgICAgIGxpc3RQT0kuZm9yRWFjaCgoZWxlbWVudCkgPT4ge1xyXG4gICAgICAgICAgICBsZXQgc3RyID0gbmV3IFNldCgpOyAgICAgICAgICAgIC8vIHByZXZlbnQgb3ZlcmxhcC9yZXBlYXRlZCBwb2kgZGF0YVxyXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKGVsZW1lbnRbMF0pO1xyXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KGVsZW1lbnRbMV0pKTtcclxuICAgICAgICAgICAgZWxlbWVudFsxXS5mb3JFYWNoKChwb2kpID0+IHsgIC8vcHJvY2VzcyBhbmQgY2xlYW4gdXAgdGFnIG5hbWVzIGFuZCBkZXNjcmlwdGlvblxyXG4gICAgICAgICAgICAgICAgbGV0IHAgPSAnJztcclxuICAgICAgICAgICAgICAgIGlmIChwb2kudGFncyAhPSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAocG9pLnRhZ3MuYW1lbml0eSAhPSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcCArPSAnYW1lbml0eSwgJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBvaS50YWdzLmN1aXNpbmUgIT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocG9pLnRhZ3MuY3Vpc2luZS5pbmNsdWRlcygnXycpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcCArPSBwb2kudGFncy5jdWlzaW5lLnNwbGl0KCdfJykuam9pbignICcpICsgJyAnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwICs9IHBvaS50YWdzLmN1aXNpbmUgKyAnICc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwb2kudGFncy5hbWVuaXR5LmluY2x1ZGVzKCdfJykpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHAgKz0gcG9pLnRhZ3MuYW1lbml0eS5zcGxpdCgnXycpLmpvaW4oJyAnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHAgKz0gcG9pLnRhZ3MuYW1lbml0eTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwb2kudGFncy5uYW1lICE9IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcCArPSAnLCAnICsgcG9pLnRhZ3MubmFtZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocG9pLnRhZ3Muc2hvcCAhPSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBvaS50YWdzLnNob3AuaW5jbHVkZXMoJ18nKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcCArPSBwb2kudGFncy5zaG9wLnNwbGl0KCdfJykuam9pbignICcpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcCArPSBwb2kudGFncy5zaG9wO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9ICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgcCArPSAnIHNob3AnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocG9pLnRhZ3MubmFtZSAhPSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHAgKz0gJywgJyArIHBvaS50YWdzLm5hbWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHBvaS50YWdzLnRvdXJpc20gIT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHAgKz0gJ3RvdXJpc20sICc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwb2kudGFncy50b3VyaXNtLmluY2x1ZGVzKCdfJykpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHAgKz0gcG9pLnRhZ3MudG91cmlzbS5zcGxpdCgnXycpLmpvaW4oJyAnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHAgKz0gcG9pLnRhZ3MudG91cmlzbTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwb2kudGFncy5uYW1lICE9IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcCArPSAnLCAnICsgcG9pLnRhZ3MubmFtZTsgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHBvaS50YWdzLmxlaXN1cmUgIT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHAgKz0gJ2xlaXN1cmUsICc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwb2kudGFncy5sZWlzdXJlLmluY2x1ZGVzKCdfJykpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHAgKz0gcG9pLnRhZ3MubGVpc3VyZS5zcGxpdCgnXycpLmpvaW4oJyAnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHAgKz0gcG9pLnRhZ3MubGVpc3VyZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwb2kudGFncy5uYW1lICE9IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcCArPSAnLCAnICsgcG9pLnRhZ3MubmFtZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocG9pLnRhZ3MuaGlzdG9yaWMgIT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHAgKz0gJ2hpc3RvcmljLCAnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocG9pLnRhZ3MuaGlzdG9yaWMuaW5jbHVkZXMoJ18nKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcCArPSBwb2kudGFncy5oaXN0b3JpYy5zcGxpdCgnXycpLmpvaW4oJyAnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHAgKz0gcG9pLnRhZ3MuaGlzdG9yaWM7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocG9pLnRhZ3MubmFtZSAhPSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHAgKz0gJywgJyArIHBvaS50YWdzLm5hbWU7IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgc3RyLmFkZChwKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coZWxlbWVudFswXSArICc6ICcgKyBzdHIuam9pbihcIjsgXCIpICsgJy4gJyk7XHJcbiAgICAgICAgICAgIGxpc3QucHVzaChlbGVtZW50WzBdICsgJzogJyArIEFycmF5LmZyb20oc3RyKS5qb2luKFwiOyBcIikgKyAnLiAnKTsgLy8gam9pbmluZyBpcyBtb3JlIGVmZmljaWVudCB0aGFuIGNvbmNhdGVuYXRpb25cclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gbGlzdDtcclxuICAgIH1cclxuXHJcbiAgICBuZ09uRGVzdHJveSgpIHtcclxuICAgICAgICAvLyBwcmV2ZW50IG1lbW9yeSBsZWFrXHJcbiAgICAgICAgdGhpcy5fc3Vic2NyaXB0aW9uQ1MudW5zdWJzY3JpYmUoKTtcclxuICAgIH1cclxuXHJcbiAgICAvKiBNaWNyb3NvZnQgQ29nbml0aXZlIFNlcnZpY2VzIHJlc3BvbmRlZCB3aXRoIFxyXG4gICAgPGgyPk91ciBzZXJ2aWNlcyBhcmVuJ3QgYXZhaWxhYmxlIHJpZ2h0IG5vdzwvaDI+PHA+V2UncmUgd29ya2luZyB0byByZXN0b3JlIGFsbCBzZXJ2aWNlcyBhcyBzb29uIGFzIHBvc3NpYmxlLiBQbGVhc2UgY2hlY2sgYmFjayBzb29uLjwvcD5SZWYgQTogMTlENTI4RDYwMTVCNDZDNEFCQ0QwRkM4QjhBOTlDNEQgUmVmIEI6IExPTjA0RURHRTA0MTEgUmVmIEM6IDIwMTgtMDUtMzFUMjE6MjQ6MTBaXHJcbiAgICBcclxuICAgIC8vIHVzZSB0eXBpY2FsIGphdmFzY3JpcHQgeG1saHR0cHJlcSBiZWNhdXNlIG9mIGFuZ3VsYXIgYnVnIHdpdGggYXBwbGljYXRpb24veC13d3ctdXJsZW5jb2RlZCB0eXBlXHJcbiAgICAgICAgbGV0IGhlYWRlcnMgPSB7IFwiT2NwLUFwaW0tU3Vic2NyaXB0aW9uLUtleVwiOiBcImU4OWIzN2ZiY2RhNTQ0OTU5ZGI4MjY3MTVhMTNhMDFiXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiQ29udGVudC10eXBlXCI6IFwiYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiQ29udGVudC1MZW5ndGhcIjogXCIwXCJ9O1xyXG5cclxuICAgICAgICB0aGlzLmh0dHBTZXJ2aWNlLnhocignUE9TVCcsIHRoaXMudG9rZW5VcmwsIG51bGwsIGhlYWRlcnMpXHJcbiAgICAgICAgICAgIC50aGVuKChyZXMpID0+IHtcclxuICAgICAgICAgICAgICAgIGxldCBoID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vc3NtbCt4bWxcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJYLU1pY3Jvc29mdC1PdXRwdXRGb3JtYXRcIjogXCJyaWZmLTI0a2h6LTE2Yml0LW1vbm8tcGNtXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIkF1dGhvcml6YXRpb25cIjogXCJCZWFyZXIgXCIgKyByZXMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIlVzZXItQWdlbnRcIjogXCJUVFNcIlxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlcyk7XHJcbiAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKHRoaXMubGlzdFRleHRbMF0pO1xyXG4gICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZygpXHJcbiAgICAgICAgICAgICAgICAvL2xldCB0ZXN0ID0gXCJCZXJuZXJzIFN0cmVldDogb3V0ZG9vciBzaG9wLCBLYXRobWFuZHU7IHRvdXJpc20sIGF0dHJhY3Rpb24sIFNvaG87IGhpc3RvcmljLCByb21hbl9yb2FkLCBST01BTiBST0FEIC0gRGV2aWwncyBIaWdod2F5LlwiO1xyXG4gICAgICAgICAgICAgICAgbGV0IHRlc3QgPSBcIjxzcGVhayB2ZXJzaW9uPScxLjAnIHhtbG5zID0gJ2h0dHA6Ly93d3cudzMub3JnLzIwMDEvMTAvc3ludGhlc2lzJyB4bWw6IGxhbmcgPSAnZW4tVVMnID48dm9pY2UgIG5hbWU9J01pY3Jvc29mdCBTZXJ2ZXIgU3BlZWNoIFRleHQgdG8gU3BlZWNoIFZvaWNlIChlbi1VUywgSmVzc2FSVVMpJyA+SGVsbG8sIHdvcmxkITwgL3ZvaWNlPiA8L3NwZWFrID5cIjtcclxuICAgICAgICAgICAgICAgIC8vbGV0IHRlc3QgPSBcIjxzcGVhayB2ZXJzaW9uPScxLjAnIHhtbDogbGFuZyA9ICdlbi1VUycgPiA8dm9pY2UgeG1sOiBsYW5nID0gJ2VuLVVTJyB4bWw6IGdlbmRlciA9ICdGZW1hbGUnIG5hbWUgPSAnTWljcm9zb2Z0IFNlcnZlciBTcGVlY2ggVGV4dCB0byBTcGVlY2ggVm9pY2UgKGVuLVVTLCBaaXJhUlVTKScgPiBNaWNyb3NvZnQgQmluZyBWb2ljZSBPdXRwdXQgQVBJIDwgL3ZvaWNlPjwvc3BlYWsgPlwiO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5odHRwU2VydmljZS54aHIoJ1BPU1QnLCB0aGlzLnN5blVybCwgdGVzdCwgaClcclxuICAgICAgICAgICAgICAgICAgICAudGhlbigocikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnYXVkaW8gJyArIHIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnRXJyb3I6ICcsIGVycm9yLnN0YXR1cywgZXJyb3Iuc3RhdHVzVGV4dCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0Vycm9yOiAnLCBlcnJvci5zdGF0dXMsIGVycm9yLnN0YXR1c1RleHQpO1xyXG4gICAgICAgICAgICB9KTsqL1xyXG59XHJcbiJdfQ==