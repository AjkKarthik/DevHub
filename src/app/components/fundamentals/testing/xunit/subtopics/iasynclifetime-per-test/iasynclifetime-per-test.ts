import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-test-iasynclifetime-per-test',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './iasynclifetime-per-test.html',
  styleUrl: './iasynclifetime-per-test.scss'
})
export class IAsyncLifetimePerTestSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "It follows the object it is on",
      "points": [
        "xUnit creates a new instance of the test class for every test method, as the page's own theory explains. A test class that implements <code>IAsyncLifetime</code> therefore gets <code>InitializeAsync</code> after each constructor call and <code>DisposeAsync</code> after each test.",
        "A class fixture is created once per test class and injected into every instance. When the fixture implements <code>IAsyncLifetime</code>, its <code>InitializeAsync</code> runs once before the first test in the class and <code>DisposeAsync</code> once after the last.",
        "The QnA described the fixture behaviour for both cases. It now separates them, because choosing the wrong one either starts an expensive resource per test or shares state you meant to reset.",
        "The page's own IClassFixture example uses the fixture version correctly: <code>DatabaseFixture</code> starts the database once for <code>UserRepositoryTests</code>."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Per test",
      "language": "csharp",
      "code": "public class CartTests : IAsyncLifetime\n{\n    private Cart _cart = null!;\n\n    public async Task InitializeAsync() => _cart = await Cart.CreateAsync();  // before EACH test\n    public Task DisposeAsync() => Task.CompletedTask;                        // after EACH test\n\n    [Fact] public void Empty_HasZeroTotal() => Assert.Equal(0, _cart.Total);\n    [Fact] public void Add_IncreasesTotal() { _cart.Add(5); Assert.Equal(5, _cart.Total); }\n}"
    },
    {
      "label": "Once per class",
      "language": "csharp",
      "code": "public class DatabaseFixture : IAsyncLifetime\n{\n    public TestDatabase Db { get; private set; } = null!;\n    public async Task InitializeAsync() => Db = await TestDatabase.StartAsync(); // once\n    public Task DisposeAsync() => Db.StopAsync();                               // once\n}\n\npublic class UserRepositoryTests : IClassFixture<DatabaseFixture>\n{\n    public UserRepositoryTests(DatabaseFixture fixture) { /* shared Db */ }\n}"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "A test class with 40 tests implements <code>IAsyncLifetime</code> and starts a PostgreSQL container in <code>InitializeAsync</code>. How many containers start, and how would you change it to start one?",
    "hint": "Count test class instances.",
    "solution": "Forty: one per test, because each test gets a new class instance. Move the container into a fixture class that implements IAsyncLifetime and have the test class implement IClassFixture<ThatFixture>, so the container starts once and is shared."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "IAsyncLifetime always means once-per-class setup.",
      "reality": "It runs once per object it is implemented on. On the test class that is once per test."
    },
    {
      "thought": "Fixture setup runs before each test.",
      "reality": "Class fixtures are created once per test class. Use the constructor or the test class's own lifecycle for per-test setup."
    }
  ];
}
