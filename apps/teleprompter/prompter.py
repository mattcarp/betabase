import json
import os
from textual.app import App, ComposeResult
from textual.containers import Container, Vertical, Horizontal
from textual.widgets import Footer, Static, Label, ProgressBar
from textual.binding import Binding
from textual.reactive import reactive
from rich.text import Text
from rich.panel import Panel
from rich.align import Align

# Load the script data
def load_script():
    try:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        data_path = os.path.join(script_dir, "script_data.json")
        if os.path.exists(data_path):
            with open(data_path, "r") as f:
                return json.load(f)
    except Exception:
        pass
    return [{"id": 1, "title": "Setup Required", "duration": 30, "bullets": ["• Please run data_loader.py!", "• Your script data was not found."]}]

DEMO_SCRIPT = load_script()

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
[dim]Version 1.2.0[/]

[blink]Press ANY KEY to begin your demo...[/]
"""

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
    Screen { 
        background: #0a0a0a; 
        align: center middle;
    }
    
    #app-container {
        width: 100%;
        height: 100%;
    }

    #splash-container {
        width: 100%;
        height: 100%;
        content-align: center middle;
        background: #050505;
    }

    #header { 
        height: 3; 
        background: #1a1a1a; 
        border-bottom: solid #a855f7; 
        content-align: center middle;
        display: none;
    }

    #main-container { 
        height: 1fr; 
        padding: 2;
        display: none;
    }

    #bullet-content { 
        height: 1fr; 
        color: #e5e5e5;
    }

    #footer-container { 
        height: 3; 
        background: #1a1a1a; 
        border-top: solid #333; 
        layout: horizontal; 
        padding: 0 2; 
        align: center middle;
        display: none;
    }

    #pacing-bar { 
        width: 1fr; 
        margin-left: 2; 
    }

    /* States */
    .started #splash-container { display: none; }
    .started #header { display: block; }
    .started #main-container { display: block; }
    .started #footer-container { display: flex; }
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
    has_started = reactive(False)

    def compose(self) -> ComposeResult:
        with Container(id="app-container"):
            yield Static(BANANA_ART, id="splash-container")
            yield Static("🎬 [bold purple]Mattie's Promptomatic[/] | [italic cyan]3-Pillar Demo[/]", id="header")
            with Vertical(id="main-container"):
                yield Static(id="bullet-content")
            with Horizontal(id="footer-container"):
                yield Label("TIME: ")
                yield TimerWidget(id="timer")
                yield ProgressBar(id="pacing-bar", total=100, show_percentage=False)
        yield Footer()

    def on_key(self) -> None:
        if not self.has_started:
            self.has_started = True
            self.add_class("started")
            self.update_view()

    def update_progress(self, time_remaining: float) -> None:
        try:
            seg = DEMO_SCRIPT[self.current_idx]
            self.query_one("#pacing-bar").progress = ((seg['duration'] - time_remaining) / seg['duration']) * 100
        except Exception:
            pass

    def watch_current_idx(self) -> None:
        if self.has_started:
            self.update_view()

    def update_view(self) -> None:
        try:
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
        except Exception:
            pass

    def action_toggle_timer(self) -> None:
        if not self.has_started: return
        self.is_running = not self.is_running
        self.query_one("#timer").is_running = self.is_running

    def action_next_scene(self) -> None:
        if not self.has_started: return
        if self.current_idx < len(DEMO_SCRIPT) - 1:
            self.current_idx += 1

    def action_prev_scene(self) -> None:
        if not self.has_started: return
        if self.current_idx > 0:
            self.current_idx -= 1

    def action_reset_scene(self) -> None:
        if not self.has_started: return
        self.update_view()

if __name__ == "__main__":
    PrompterApp().run()

from textual.app import App, ComposeResult
from textual.containers import Container, Vertical, Horizontal
from textual.widgets import Footer, Static, Label, ProgressBar
from textual.binding import Binding
from textual.reactive import reactive
from rich.text import Text
from rich.panel import Panel
from rich.align import Align

# Load the script data
def load_script():
    try:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        data_path = os.path.join(script_dir, "script_data.json")
        if os.path.exists(data_path):
            with open(data_path, "r") as f:
                return json.load(f)
    except Exception:
        pass
    return [{"id": 1, "title": "Setup Required", "duration": 30, "bullets": ["• Please run data_loader.py!", "• Your script data was not found."]}]

DEMO_SCRIPT = load_script()

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
[dim]Version 1.2.0[/]

[blink]Press ANY KEY to begin your demo...[/]
"""

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
    Screen { 
        background: #0a0a0a; 
        align: center middle;
    }
    
    #app-container {
        width: 100%;
        height: 100%;
    }

    #splash-container {
        width: 100%;
        height: 100%;
        content-align: center middle;
        background: #050505;
    }

    #header { 
        height: 3; 
        background: #1a1a1a; 
        border-bottom: solid #a855f7; 
        content-align: center middle;
        display: none;
    }

    #main-container { 
        height: 1fr; 
        padding: 2;
        display: none;
    }

    #bullet-content { 
        height: 1fr; 
        color: #e5e5e5;
    }

    #footer-container { 
        height: 3; 
        background: #1a1a1a; 
        border-top: solid #333; 
        layout: horizontal; 
        padding: 0 2; 
        align: center middle;
        display: none;
    }

    #pacing-bar { 
        width: 1fr; 
        margin-left: 2; 
    }

    /* States */
    .started #splash-container { display: none; }
    .started #header { display: block; }
    .started #main-container { display: block; }
    .started #footer-container { display: flex; }
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
    has_started = reactive(False)

    def compose(self) -> ComposeResult:
        with Container(id="app-container"):
            yield Static(BANANA_ART, id="splash-container")
            yield Static("🎬 [bold purple]Mattie's Promptomatic[/] | [italic cyan]3-Pillar Demo[/]", id="header")
            with Vertical(id="main-container"):
                yield Static(id="bullet-content")
            with Horizontal(id="footer-container"):
                yield Label("TIME: ")
                yield TimerWidget(id="timer")
                yield ProgressBar(id="pacing-bar", total=100, show_percentage=False)
        yield Footer()

    def on_key(self) -> None:
        if not self.has_started:
            self.has_started = True
            self.add_class("started")
            self.update_view()

    def update_progress(self, time_remaining: float) -> None:
        try:
            seg = DEMO_SCRIPT[self.current_idx]
            self.query_one("#pacing-bar").progress = ((seg['duration'] - time_remaining) / seg['duration']) * 100
        except Exception:
            pass

    def watch_current_idx(self) -> None:
        if self.has_started:
            self.update_view()

    def update_view(self) -> None:
        try:
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
        except Exception:
            pass

    def action_toggle_timer(self) -> None:
        if not self.has_started: return
        self.is_running = not self.is_running
        self.query_one("#timer").is_running = self.is_running

    def action_next_scene(self) -> None:
        if not self.has_started: return
        if self.current_idx < len(DEMO_SCRIPT) - 1:
            self.current_idx += 1

    def action_prev_scene(self) -> None:
        if not self.has_started: return
        if self.current_idx > 0:
            self.current_idx -= 1

    def action_reset_scene(self) -> None:
        if not self.has_started: return
        self.update_view()

if __name__ == "__main__":
    PrompterApp().run()
