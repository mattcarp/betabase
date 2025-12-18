import json
import os
from textual.app import App, ComposeResult
from textual.containers import Vertical, Horizontal, ScrollableContainer
from textual.widgets import Static, Label, ProgressBar, Footer, Header
from textual.binding import Binding
from textual.reactive import reactive

def load_script():
    try:
        with open("script_data.json", "r") as f:
            return json.load(f)
    except:
        return [{"id": 1, "title": "ERROR", "duration": 30, "script": ["Run: python3 data_loader.py"]}]

DEMO_SCRIPT = load_script()

class PrompterApp(App):
    CSS = """
    Screen { background: #000; }
    #main { height: 1fr; }
    #content { height: 1fr; padding: 4; background: #050505; }
    #timer-bar { height: 6; background: #1a1a1a; border-top: thick #a855f7; padding: 1 3; }
    #timer-display { width: 15; text-align: right; }
    #progress { width: 1fr; margin-left: 3; }
    """

    BINDINGS = [
        ("space", "toggle", "▶/⏸"),
        ("right", "next", "→"),
        ("left", "prev", "←"),
        ("r", "reset", "↻"),
        ("q", "quit", "Quit"),
    ]

    idx = reactive(0)
    running = reactive(False)
    time_left = reactive(0.0)
    total_time = reactive(0.0)
    show_splash = reactive(True)

    def compose(self) -> ComposeResult:
        yield Header()
        with ScrollableContainer(id="main"):
            yield Static(id="content")
        with Horizontal(id="timer-bar"):
            yield Label("⏱  ", id="timer-label")
            yield Static("00:00", id="timer-display")
            yield ProgressBar(total=100, show_percentage=False, id="progress")
        yield Footer()

    def on_mount(self) -> None:
        self.title = "Mattie's Promptomatic 🍌"
        self.set_interval(0.1, self.tick)
        self.update_view()

    def tick(self) -> None:
        if self.running and self.time_left > 0:
            self.time_left -= 0.1
            mins, secs = divmod(int(self.time_left), 60)
            color = "green"
            if self.time_left < 5: color = "red bold blink"
            elif self.time_left < self.total_time / 3: color = "yellow bold"
            self.query_one("#timer-display").update(f"[{color}]{mins:02d}:{secs:02d}[/]")
            if self.total_time > 0:
                prog = ((self.total_time - self.time_left) / self.total_time) * 100
                self.query_one("#progress").update(progress=prog)
        elif self.running and self.time_left <= 0:
            self.running = False
            self.notify("⏱ Scene Complete!", timeout=3)

    def watch_idx(self) -> None:
        if not self.show_splash:
            self.update_view()

    def update_view(self) -> None:
        if self.show_splash:
            splash = """
[bold yellow]          .
         //
        //
  _____//_____
 /            \\
|  NANO BANANA |
|      PRO     |
 \\____________/[/]


[bold purple]Mattie's Promptomatic[/]
[dim]5-Minute CapCut Demo[/]



[blink bold white]Press SPACE to begin...[/]
"""
            self.query_one("#content").update(splash)
        else:
            scene = DEMO_SCRIPT[self.idx]
            
            # HUGE HEADER with timing
            display = f"""[bold purple on #222]{'═' * 80}[/]
[bold purple on #222]  SCENE {scene['id']}: {scene['title'].upper()}[/]
[bold purple on #222]  {scene['time']} • {scene['duration']} SECONDS[/]
[bold purple on #222]{'═' * 80}[/]



"""
            
            # VOICEOVER - HUGE SPACING
            for line in scene['script']:
                display += f"[bold white]{line}[/]\n\n\n"
            
            # ACTIONS (if present)
            if 'actions' in scene:
                display += "\n\n[bold cyan]═══ ACTIONS TO RECORD ═══[/]\n\n"
                for action in scene['actions']:
                    display += f"   • {action}\n\n"
            
            # STATS (if present)  
            if 'stats' in scene:
                display += "\n\n[bold green]═══ STATS TO SHOW ═══[/]\n\n"
                for stat in scene['stats']:
                    display += f"   • {stat}\n\n"
            
            # FOOTER
            display += f"\n\n[dim]{'─' * 80}[/]\n[dim]Scene {scene['id']}/6 • Space=Start/Pause • →=Next • Q=Quit[/]"
            
            self.query_one("#content").update(display)
            self.total_time = float(scene['duration'])
            self.time_left = float(scene['duration'])
            self.running = False
            self.query_one("#progress").update(progress=0)

    def action_toggle(self) -> None:
        if self.show_splash:
            self.show_splash = False
            self.update_view()
        else:
            self.running = not self.running
            if self.running:
                self.notify("🎤 RECORDING", timeout=2)

    def action_next(self) -> None:
        if self.show_splash: return
        if self.idx < len(DEMO_SCRIPT) - 1:
            self.idx += 1
        else:
            self.notify("🎬 THAT'S A WRAP! 🍌", timeout=5)

    def action_prev(self) -> None:
        if self.show_splash: return
        if self.idx > 0:
            self.idx -= 1

    def action_reset(self) -> None:
        if self.show_splash: return
        self.update_view()

if __name__ == "__main__":
    PrompterApp().run()
