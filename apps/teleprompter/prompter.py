import json
import os
from textual.app import App, ComposeResult
from textual.containers import Container, Vertical, Center, Middle
from textual.widgets import Footer, Static, Label, ProgressBar
from textual.binding import Binding
from textual.reactive import reactive
from textual.screen import Screen
from rich.text import Text
from rich.panel import Panel
from rich.align import Align

# Load the script data
try:
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(script_dir, "script_data.json")
    with open(data_path, "r") as f:
        DEMO_SCRIPT = json.load(f)
except Exception:
    DEMO_SCRIPT = [{"id": 1, "title": "Error", "duration": 10, "bullets": ["Run data_loader.py first!"]}]

BANANA_ART = r"""
[bold yellow]
          .
         //
        //
  _____//_____
 /            \\
|  NANO BANANA |
|      PRO     |
 \____________/
[/]
[bold purple]Mattie's Promptomatic[/]
"""

class SplashScreen(Screen):
    def compose(self) -> ComposeResult:
        with Center():
            with Middle():
                yield Static(BANANA_ART, id="splash-art")
                yield Static("[blink]Press ANY KEY to start...[/]", id="splash-prompt")

    def on_key(self) -> None:
        self.app.pop_screen()

class TimerWidget(Static):
    time_remaining = reactive(0.0)
    total_duration = reactive(0.0)
    is_running = reactive(False)

    def on_mount(self) -> None:
        self.set_interval(0.1, self.update_timer)

    def update_timer(self) -> None:
        if self.is_running and self.time_remaining > 0:
            self.time_remaining -= 0.1
            self.app.update_progress(self.time_remaining)
        elif self.time_remaining <= 0 and self.is_running:
            self.is_running = False
            self.time_remaining = 0
            self.app.notify("Segment Complete!", severity="information")

    def render(self) -> str:
        minutes, seconds = divmod(int(self.time_remaining), 60)
        time_str = f"{minutes:02d}:{seconds:02d}"
        color = "green"
        if self.time_remaining < 5: color = "red"
        elif self.time_remaining < (self.total_duration / 3): color = "yellow"
        return f"[{color}]{time_str}[/]"

class PrompterApp(App):
    CSS = """
    Screen { background: #0a0a0a; }
    SplashScreen { align: center middle; background: #050505; }
    #splash-art { text-align: center; margin-bottom: 2; }
    #splash-prompt { text-align: center; color: #555; }
    #header { height: 3; background: #1a1a1a; border-bottom: solid #a855f7; content-align: center middle; }
    #main-container { height: 1fr; padding: 2; }
    #bullet-content { height: 1fr; color: #e5e5e5; font-size: 150%; }
    #footer-container { height: 3; background: #1a1a1a; border-top: solid #333; layout: horizontal; padding: 0 2; align: center middle; }
    #pacing-bar { width: 1fr; margin-left: 2; }
    """

    BINDINGS = [
        Binding("space", "toggle_timer", "Start/Pause", show=True),
        Binding("right", "next_scene", "Next", show=True),
        Binding("left", "prev_scene", "Back", show=True),
        Binding("r", "reset_scene", "Reset", show=True),
        Binding("q", "quit", "Quit", show=True),
    ]

    current_idx = reactive(0)
    is_running = reactive(False)

    def compose(self) -> ComposeResult:
        yield Container(
            Static("🎬 [bold purple]Mattie's Promptomatic[/]", id="header"),
            Vertical(Static(id="bullet-content"), id="main-container"),
            Horizontal(
                Label("TIME: "),
                TimerWidget(id="timer"),
                ProgressBar(id="pacing-bar", total=100, show_percentage=False),
                id="footer-container"
            )
        )
        yield Footer()

    def on_mount(self) -> None:
        self.push_screen(SplashScreen())
        self.call_after_refresh(self.update_view)

    def update_progress(self, time_remaining: float) -> None:
        seg = DEMO_SCRIPT[self.current_idx]
        self.query_one("#pacing-bar").progress = ((seg['duration'] - time_remaining) / seg['duration']) * 100

    def watch_current_idx(self) -> None:
        if self.is_mounted: self.update_view()

    def update_view(self) -> None:
        seg = DEMO_SCRIPT[self.current_idx]
        content = "\n".join(seg['bullets'])
        self.query_one("#bullet-content").update(
            Panel(
                Align.left(content),
                title=f"[bold cyan]{seg['title']}[/]",
                subtitle=f"[Segment {seg['id']}/{len(DEMO_SCRIPT)} | Target: {seg['duration']}s]",
                border_style="purple",
                padding=(2, 4)
            )
        )
        timer = self.query_one("#timer")
        timer.total_duration = float(seg['duration'])
        timer.time_remaining = float(seg['duration'])
        timer.is_running = False
        self.is_running = False
        self.query_one("#pacing-bar").progress = 0

    def action_toggle_timer(self) -> None:
        self.is_running = not self.is_running
        self.query_one("#timer").is_running = self.is_running

    def action_next_scene(self) -> None:
        if self.current_idx < len(DEMO_SCRIPT) - 1: self.current_idx += 1

    def action_prev_scene(self) -> None:
        if self.current_idx > 0: self.current_idx -= 1

    def action_reset_scene(self) -> None:
        self.update_view()

if __name__ == "__main__":
    PrompterApp().run()
