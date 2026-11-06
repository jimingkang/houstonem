import { Component, signal, ElementRef, ViewChild, afterNextRender, Injector, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
interface Message {role:'user'|'assistant';content:string;}
@Component({
  selector:'app-chatbot', imports:[FormsModule,RouterLink],
  template:`
    @if(open()) {
      <section class="chat-panel" aria-label="Laboratory AI assistant" (keydown.escape)="close()">
        <header><span class="avatar" aria-hidden="true">✳</span><div><strong>HEM Assistant</strong><small>Local AI · Materials analysis</small></div><button type="button" aria-label="Close chat" (click)="close()">×</button></header>
        <div #transcript class="transcript" role="log" aria-live="polite" aria-relevant="additions" tabindex="0"><div class="message assistant">Hello! I’m HEM’s AI assistant. Tell me about your material or the question you’re trying to answer.</div>
          @if(messages().length===0){<div class="suggestions">@for(prompt of prompts;track prompt){<button type="button" (click)="ask(prompt)" [disabled]="busy()">{{prompt}} ↗</button>}</div>}
          @for(message of messages();track $index){<div class="message" [class.user]="message.role==='user'" [class.assistant]="message.role==='assistant'"><span class="sr-only">{{message.role==='user'?'You:':'AI assistant:'}}</span>{{message.content}}</div>}
          @if(busy()){<div class="message assistant" role="status">Looking into your question…</div>}
        </div>
        <div class="chat-tools"><button type="button" (click)="reset()" [disabled]="busy()">New chat</button><a routerLink="/portal" (click)="close()">Client Portal ↗</a><a href="mailto:LAB@houstonem.com">Contact lab ↗</a></div>
        <label class="account"><input type="checkbox" [ngModel]="account" (ngModelChange)="setAccount($event)" [disabled]="busy()"> Ask about my services / report status (sign-in required)</label>
        @if(error()){<p class="chat-error" role="alert">{{error()}}</p>}
        <form (ngSubmit)="send()"><label class="sr-only" for="chat-message">Your message</label><textarea #composer id="chat-message" name="chat-message" [(ngModel)]="draft" maxlength="2000" rows="2" placeholder="How can we help with your materials?" [disabled]="busy()" (keydown.enter)="onEnter($event)"></textarea><button class="send" type="submit" [disabled]="busy()||!draft.trim()" aria-label="Send message">↑</button></form>
        <p class="disclosure">AI can make mistakes. Messages are processed by the local Ollama server. Account mode includes your service and report metadata, never report files. Confirm technical advice with our lab.</p>
      </section>
    }
    <button #launcher type="button" class="launcher" (click)="toggle()" [attr.aria-expanded]="open()" aria-label="Chat with HEM AI assistant"><span aria-hidden="true">✳</span> {{open()?'Close chat':'Ask our AI assistant'}}</button>
  `,
  styles:`
    :host{position:fixed;right:24px;bottom:22px;z-index:100}.launcher{display:flex;align-items:center;gap:10px;background:#173e35;color:white;border:1px solid #ffffff35;border-radius:40px;padding:14px 21px;font:500 13px var(--font-sans);box-shadow:0 5px 25px #173e3526;cursor:pointer;margin-left:auto}.launcher span{font-size:22px;color:#cbdcbd}.chat-panel{display:flex;flex-direction:column;width:390px;max-width:calc(100vw - 32px);height:650px;max-height:calc(100dvh - 115px);background:white;border:1px solid #cdd8d0;border-radius:14px;margin-bottom:12px;box-shadow:0 14px 70px #14382b30;overflow:hidden}header{display:flex;align-items:center;gap:11px;padding:18px 20px;background:#173e35;color:white}header strong{display:block;font-size:14px;font-weight:600}header small{display:block;font-size:10px;color:#c1d4c8;margin-top:3px}.avatar{font-size:29px;color:#cbdcbd}header button{margin-left:auto;color:white;border:0;background:none;font-size:28px;cursor:pointer}.transcript{overflow:auto;flex:1;min-height:90px;padding:18px;display:flex;flex-direction:column;gap:14px;overscroll-behavior:contain}.message{padding:12px 14px;border-radius:10px;font-size:13px;line-height:1.7;white-space:pre-wrap;overflow-wrap:anywhere;max-width:94%;flex-shrink:0}.assistant{background:#f0f4f0;align-self:start}.user{background:#225c49;color:white;align-self:end}.suggestions{display:flex;flex-direction:column;gap:7px}.suggestions button{border:1px solid #d6e0d8;background:white;border-radius:6px;padding:9px 12px;font:12px var(--font-sans);text-align:left;color:var(--primary);cursor:pointer}.chat-tools{display:flex;justify-content:space-between;padding:10px 18px;border-top:1px solid var(--line);font-size:10px}.chat-tools button{font:inherit;border:0;background:none;color:var(--primary);cursor:pointer;padding:0}.chat-tools a{text-decoration:none}.account{display:flex;align-items:start;gap:7px;padding:0 18px 9px;font-size:10px;color:var(--muted);line-height:1.6}.account input{margin:2px 0 0;accent-color:var(--primary)}form{position:relative;margin:0 14px}textarea{display:block;width:100%;border:1px solid #cbd7ce;border-radius:8px;resize:none;padding:12px 48px 12px 12px;font:13px/1.5 var(--font-sans);color:var(--ink)}.send{position:absolute;right:9px;bottom:12px;background:var(--primary);color:white;border:0;border-radius:6px;width:30px;height:30px;font-size:20px;cursor:pointer}button:disabled{opacity:.5;cursor:default}.disclosure{font-size:9px;color:#697b70;padding:9px 17px 13px;line-height:1.5}.chat-error{color:#a53b2b;font-size:11px;padding:0 18px 8px}@media(max-width:500px){:host{right:12px;bottom:12px}.chat-panel{width:calc(100vw - 24px);max-width:none;max-height:calc(100dvh - 90px)}.launcher{padding:11px 16px}}
  `,
})
export class Chatbot {
  protected readonly open=signal(false);protected readonly busy=signal(false);protected readonly error=signal('');protected readonly messages=signal<Message[]>([]);
  protected draft='';protected account=false;
  protected readonly prompts=['Which analysis service do I need?','How do I send a sample?','Can I watch the analysis remotely?'];
  @ViewChild('transcript') transcript?:ElementRef<HTMLElement>;@ViewChild('composer') composer?:ElementRef<HTMLTextAreaElement>;@ViewChild('launcher') launcher?:ElementRef<HTMLButtonElement>;
  private readonly injector=inject(Injector);
  protected toggle(){if(this.open())this.close();else{this.open.set(true);this.render(true);}}
  protected close(){this.open.set(false);this.launcher?.nativeElement.focus();}
  protected reset(){this.messages.set([]);this.error.set('');this.draft='';this.render(true);}
  protected setAccount(value:boolean){this.account=value;this.reset();}
  protected ask(prompt:string){this.draft=prompt;void this.send();}
  protected onEnter(event:Event){const key=event as KeyboardEvent;if(!key.shiftKey&&!key.isComposing){event.preventDefault();void this.send();}}
  private render(focus=false){afterNextRender(()=>{const el=this.transcript?.nativeElement;if(el)el.scrollTop=el.scrollHeight;if(focus&&this.open())this.composer?.nativeElement.focus();},{injector:this.injector});}
  protected async send(){const text=this.draft.trim();if(!text||this.busy())return;this.busy.set(true);this.error.set('');const history:Message[]=this.account?[]:this.messages().slice(-18);const input:Message[]=[...history,{role:'user',content:text}];this.messages.update(m=>[...m,{role:'user',content:text}]);this.draft='';this.render();
    try{const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(125000),body:JSON.stringify({messages:input,includeAccount:this.account})});const result=await response.json();if(!response.ok)throw Error(result.error || 'Unable to connect. Please contact the lab.');this.messages.update(m=>[...m,{role:'assistant',content:result.reply}]);}catch(error){this.error.set(error instanceof Error&&error.name!=='TimeoutError'?error.message:'The assistant timed out. Please try again.');this.messages.update(m=>m.slice(0,-1));this.draft=text;}finally{this.busy.set(false);this.render(true);}}
}
