import { Component, OnInit } from "@angular/core";
import { MessageService } from "../../message.service";

@Component({
    selector: "Browse",
    moduleId: module.id,
    templateUrl: "./browse.component.html"
})
export class BrowseComponent implements OnInit {

    public computeStatus;
    public nl = "\n";
    public pois;

    //public tests = ["Earlham Street: amenity, motorcycle parking; tourism, hotel, Mercer Street Hotel; amenity, cafe, Caffe Nero; clothes shop, Farah; clothes shop, Foxhall; vacant shop; yes shop, Magma; amenity, indian restaurant, Sartaj Restaurant; clothes shop, Super Superficial Gallery Seven; antiques shop, The Vintage Showroom; amenity, bubble tea cafe, Yao Yao Cha; bicycle shop, Fixation London; clothes shop, Finisterre; clothes shop, Industrie; clothes shop, Le Coq Sportif; clothes shop, Carhartt; art shop, The Unit. ","Monmouth Street: amenity, bicycle parking; amenity, cafe, La Bottega; hairdresser shop, Sasoon Salon; clothes shop, Loft; shoes shop, Poste Mistress; clothes shop; beauty shop, Screen Face; amenity, restaurant, Kopapa; clothes shop, Base Fashions; amenity, pub, The Two Brewers; amenity, bubble tea cafe, Yao Yao Cha; jewelry shop, Laura Lee; jewelry shop, Tatty Devine; clothes shop, Natural Selection; cosmetics shop, Le Labo. ","Earlham Street: amenity, toilets; bicycle shop, Brooks; amenity, waste basket; clothes shop, Superdry; amenity, theatre, Donmar Warehouse; amenity, belgian restaurant, Belgo Centraal; chocolate shop, Rococo Chocolates; amenity, community centre, Covent Garden Community Centre; amenity, theatre, Cambridge Theatre. ,Monmouth Street: amenity, cafe, Monmouth Cafe; amenity, post box; tourism, hotel, Seven Dials Hotel; amenity, restaurant, Cafe Pasta; amenity, bicycle parking; amenity, waste basket; amenity, restaurant, Mon Plaistow; tourism, hotel, Mercer Street Hotel; furniture shop, Molteni & C Dada; optician shop, Spex; clothes shop, Coco de Mer; clothes shop, Unconditional; ticket shop, London Theatre Bookings; tourism, hotel, Covent Garden Hotel; amenity, french restaurant, Mon Plaisir; yes shop, Caudalie; confectionery shop, Hotel Chocolat; yes shop, (Malin+Goetz); perfumery shop, Miller Harris; yes shop, Murdock. ,Mercer Street: tourism, hotel, Mercer Street Hotel. ","Seven Dials roundabout: historic, clock, Seven Dials; amenity, bicycle parking; amenity, restaurant, dial; tourism, information; amenity, restaurant, Kopapa; amenity, bar, Lounge Bar; tourism, hotel, Mercer Street Hotel; optician shop, Spex; clothes shop, Le Coq Sportif. ","Shorts Gardens: amenity, atm; clothes shop, G-Star Raw; clothes shop, Element; bag shop, The Cambridge Satchel Company; organic shop, Neal's Yard Dairy; beauty shop, Benefit; amenity, portuguese restaurant, Canela; confectionery shop, Choccywoccydoodah. ","Mercer Street: . "]; 

    public _subscriptionCS;
    public _subscriptionPT;

    constructor(private messageService: MessageService) {
        this.computeStatus = messageService.computeStatus;
        this._subscriptionCS = messageService.computeStatusSource.subscribe((status) => { 
            this.computeStatus = status; 
        });

        this.pois = messageService.listPathPOIText;
        this._subscriptionPT = messageService.listPathPOITextSource.subscribe((list) => {
            this.pois = list;
        });
    }

    showPOIs() {
        console.log(this.pois);
    }

    ngOnInit(): void {
    }

    ngOnDestroy() {
        // prevent memory leak
        this._subscriptionCS.unsubscribe();
        this._subscriptionPT.unsubscribe();
    }
}
