import {Component, OnDestroy, OnInit} from '@angular/core';
import {TodoListService} from "./todo-list.service";
import {BroadcastService, MsalService} from "@azure/msal-angular";
import {TodoList} from "./todoList";
import {Subscription} from "rxjs/Subscription";

@Component({
  selector: 'app-todo-list',
  templateUrl: './todo-list.component.html',
  styleUrls: ['./todo-list.component.css']
})
export class TodoListComponent implements OnInit, OnDestroy  {

 private error = "";
  private loadingMessage = "Loading...";
   todoList: TodoList[];
  private newTodoCaption = "";
  private submitted = false;
private subscription: Subscription;
  constructor(private todoListService: TodoListService, private broadcastService : BroadcastService, private msalService: MsalService) { }

  ngOnInit() {
    this.populate();

    this.subscription = this.broadcastService.subscribe("msal:acquireTokenFailure", (payload) => {
      console.log("acquire token failure");
      if (payload.indexOf("consent_required") !== -1 || payload.indexOf("interaction_required") != -1 ) {
        this.msalService.acquire_token_popup(['api://a88bb933-319c-41b5-9f04-eff36d985612/access_as_user']).then( (token) => {
          this.todoListService.getItems().subscribe( (results) => {
            this.error = '';
            this.todoList = results;
            this.loadingMessage = "";
          },  (err) => {
            this.error = err;
            this.loadingMessage = "";
          });
        },  (error) => {
        });
      }
    });


   this.subscription = this.broadcastService.subscribe("msal:acquireTokenSuccess", (payload) => {
      console.log("acquire token success");
    });
  }

  public populate() {
    this.todoListService.getItems().subscribe(result => {
      this.todoList = result;
      this.loadingMessage = "";
    }, error => {
      console.log("access token silent failed");
      this.error = error;
      this.loadingMessage = "";
    });
  }

  add(isValid : boolean) {
    this.submitted = true;
    if(isValid) {
      this.todoListService.postItem({
        'title': this.newTodoCaption,
      }).subscribe( (results) => {
      this.loadingMessage = "";
        this.newTodoCaption = "";
        this.populate();
      }, (err) => {
        this.error = err;
       this.loadingMessage = "";
      })
    }
    else {
    }
  };

//extremely important to unsubscribe
  ngOnDestroy() {
    this.broadcastService.getMSALSubject().next(1);
   if(this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
