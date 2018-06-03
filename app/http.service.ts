import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Observable";
import { retry, retryWhen, take, concat } from 'rxjs/operators';
import { delay } from 'rxjs/operators/delay';
import 'rxjs/add/observable/throw';
import { HttpClient, HttpHeaders, HttpResponse } from "@angular/common/http";

@Injectable()
export class HttpService {

    constructor(private http: HttpClient) { }

    getData(url) {
        return this.http.get(url)
            .pipe(
                retryWhen(errors =>
                    errors.pipe(
                        delay(400),
                        take(2)))
            ); //retry twice with delay
    }

    postData(url, query) {
        return this.http.post(url, query, {
            headers: new HttpHeaders()
                .set('Referer', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript')
                .set('User-Agent', 'Googlebot/2.1 (+http://www.google.com/bot.html)') //try to prevent error 429
        }).pipe(
            retryWhen(errors => errors.pipe(
            delay(400), take(2), concat(Observable.throw(errors))))); //retry twice with delay
    }

    public xhr(method, url, data, headers) { // use typical javascript xmlhttpreq because of angular bug with application/x-www-urlencoded type
        return new Promise(function (resolve, reject) {
            let req = new XMLHttpRequest();
            req.open(method, url);
            req.onload = function () {
                if (this.status === 200) {
                    resolve(req.responseText);
                } else {
                    reject({
                        status: req.status,
                        statusText: req.statusText
                    });
                }
            };
            req.onerror = function () {
                reject({
                    status: req.status,
                    statusText: req.statusText
                });
            };
            if (headers) {
                Object.keys(headers).forEach(function (key) {
                    req.setRequestHeader(key, headers[key]);
                });
            }
            if (data && typeof data === 'object') {
                data = Object.keys(data).map(function (key) {
                    return encodeURIComponent(key) + '=' + encodeURIComponent(data[key]);
                }).join('&');
            }
            req.send(data);
        });
    }
}