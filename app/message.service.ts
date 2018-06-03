import { Injectable } from '@angular/core';
import { Subject }    from 'rxjs/Subject';
 
@Injectable()
export class MessageService {
    public computeStatus;

    public listPathPOIText;

    public computeStatusSource = new Subject<string>();

    public listPathPOITextSource = new Subject<string[]>();

    constructor() {
        this.computeStatus = ""; //set default/starting value
        this.listPathPOIText = [""];
    }
 
  // Service message commands
    updateComputeStatus(status) {
        this.computeStatus = status;
        this.computeStatusSource.next(status);
    }

    updateListPathPOIText(list) {
        this.listPathPOIText = list;
        this.listPathPOITextSource.next(list);
    }

}