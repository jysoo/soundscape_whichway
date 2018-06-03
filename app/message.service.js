"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var Subject_1 = require("rxjs/Subject");
var MessageService = /** @class */ (function () {
    function MessageService() {
        this.computeStatusSource = new Subject_1.Subject();
        this.listPathPOITextSource = new Subject_1.Subject();
        this.computeStatus = ""; //set default/starting value
        this.listPathPOIText = [""];
    }
    // Service message commands
    MessageService.prototype.updateComputeStatus = function (status) {
        this.computeStatus = status;
        this.computeStatusSource.next(status);
    };
    MessageService.prototype.updateListPathPOIText = function (list) {
        this.listPathPOIText = list;
        this.listPathPOITextSource.next(list);
    };
    MessageService = __decorate([
        core_1.Injectable(),
        __metadata("design:paramtypes", [])
    ], MessageService);
    return MessageService;
}());
exports.MessageService = MessageService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVzc2FnZS5zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibWVzc2FnZS5zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsc0NBQTJDO0FBQzNDLHdDQUEwQztBQUcxQztJQVNJO1FBSk8sd0JBQW1CLEdBQUcsSUFBSSxpQkFBTyxFQUFVLENBQUM7UUFFNUMsMEJBQXFCLEdBQUcsSUFBSSxpQkFBTyxFQUFZLENBQUM7UUFHbkQsSUFBSSxDQUFDLGFBQWEsR0FBRyxFQUFFLENBQUMsQ0FBQyw0QkFBNEI7UUFDckQsSUFBSSxDQUFDLGVBQWUsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ2hDLENBQUM7SUFFSCwyQkFBMkI7SUFDekIsNENBQW1CLEdBQW5CLFVBQW9CLE1BQU07UUFDdEIsSUFBSSxDQUFDLGFBQWEsR0FBRyxNQUFNLENBQUM7UUFDNUIsSUFBSSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUMxQyxDQUFDO0lBRUQsOENBQXFCLEdBQXJCLFVBQXNCLElBQUk7UUFDdEIsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUM7UUFDNUIsSUFBSSxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMxQyxDQUFDO0lBdkJRLGNBQWM7UUFEMUIsaUJBQVUsRUFBRTs7T0FDQSxjQUFjLENBeUIxQjtJQUFELHFCQUFDO0NBQUEsQUF6QkQsSUF5QkM7QUF6Qlksd0NBQWMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBJbmplY3RhYmxlIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBTdWJqZWN0IH0gICAgZnJvbSAncnhqcy9TdWJqZWN0JztcbiBcbkBJbmplY3RhYmxlKClcbmV4cG9ydCBjbGFzcyBNZXNzYWdlU2VydmljZSB7XG4gICAgcHVibGljIGNvbXB1dGVTdGF0dXM7XG5cbiAgICBwdWJsaWMgbGlzdFBhdGhQT0lUZXh0O1xuXG4gICAgcHVibGljIGNvbXB1dGVTdGF0dXNTb3VyY2UgPSBuZXcgU3ViamVjdDxzdHJpbmc+KCk7XG5cbiAgICBwdWJsaWMgbGlzdFBhdGhQT0lUZXh0U291cmNlID0gbmV3IFN1YmplY3Q8c3RyaW5nW10+KCk7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5jb21wdXRlU3RhdHVzID0gXCJcIjsgLy9zZXQgZGVmYXVsdC9zdGFydGluZyB2YWx1ZVxuICAgICAgICB0aGlzLmxpc3RQYXRoUE9JVGV4dCA9IFtcIlwiXTtcbiAgICB9XG4gXG4gIC8vIFNlcnZpY2UgbWVzc2FnZSBjb21tYW5kc1xuICAgIHVwZGF0ZUNvbXB1dGVTdGF0dXMoc3RhdHVzKSB7XG4gICAgICAgIHRoaXMuY29tcHV0ZVN0YXR1cyA9IHN0YXR1cztcbiAgICAgICAgdGhpcy5jb21wdXRlU3RhdHVzU291cmNlLm5leHQoc3RhdHVzKTtcbiAgICB9XG5cbiAgICB1cGRhdGVMaXN0UGF0aFBPSVRleHQobGlzdCkge1xuICAgICAgICB0aGlzLmxpc3RQYXRoUE9JVGV4dCA9IGxpc3Q7XG4gICAgICAgIHRoaXMubGlzdFBhdGhQT0lUZXh0U291cmNlLm5leHQobGlzdCk7XG4gICAgfVxuXG59Il19