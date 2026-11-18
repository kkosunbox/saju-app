import ExpoModulesCore
import UIKit

/// 상단 바를 둘 자리. iOS 27.1의 바 레이아웃 영역(`.bar(onEdge: .top, extent:)`)을 읽어 JS로 보낸다.
///
/// 일반 안전 영역은 화면 모서리에 놓인 상태 표시(iPhone Duo의 시간 · 와이파이 묶음)까지 위쪽 띠 전체로 잡아서,
/// 펼친 세로 모드에서는 상단 바가 그 높이만큼 통째로 내려가고, 접었을 때는 오른쪽 세로 막대를 모른다.
/// 바 영역은 '이 높이의 바를 위쪽에 둘 때' 바가 쓸 수 있는 자리를 알려 준다. iPhone Duo에서 잰 값:
/// - 펼친 세로: 위 24 · 오른쪽 144 (일반 안전 영역은 위 82) — 상태 표시 옆까지 올라가고 오른쪽만 비켜 선다
/// - 접힘: 위 24 · 오른쪽 84 (일반 안전 영역은 위 0 · 오른쪽 84)
/// iOS 27.1 전에는 일반 안전 영역을 그대로 보낸다.
public final class TopBarRegionModule: Module {
  public func definition() -> ModuleDefinition {
    Name("TopBarRegion")

    View(TopBarRegionView.self) {
      Events("onRegionChange")

      /// 상단 바 높이 (pt)
      Prop("barHeight") { (view: TopBarRegionView, height: Double) in
        view.barHeight = CGFloat(height)
      }
    }
  }
}

/// 화면 전체를 덮는 보이지 않는 뷰. 창이나 다른 뷰가 아니라 자기 자신의 영역을 읽어서,
/// 접고 펴거나 화면 크기가 바뀌면 같이 바뀐다.
public final class TopBarRegionView: ExpoView {
  let onRegionChange = EventDispatcher()
  var barHeight: CGFloat = 56 {
    didSet { report() }
  }
  private var last: [String: Double]?

  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    isUserInteractionEnabled = false
    backgroundColor = .clear
  }

  public override func safeAreaInsetsDidChange() {
    super.safeAreaInsetsDidChange()
    report()
  }

  public override func layoutSubviews() {
    super.layoutSubviews()
    report()
  }

  private func report() {
    // 창에 붙기 전(크기 0)의 값은 보내지 않는다
    guard window != nil, bounds.width > 0 else { return }
    var region = safeAreaInsets
    if #available(iOS 27.1, *) {
      region = edgeInsets(for: .bar(onEdge: UIRectEdge.top, extent: barHeight))
    }
    let payload: [String: Double] = [
      "top": Double(region.top),
      "left": Double(region.left),
      "right": Double(region.right),
    ]
    guard payload != last else { return }
    last = payload
    onRegionChange(payload)
  }
}
